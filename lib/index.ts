import { Rank, tensor, Tensor, io, setBackend, env } from '@tensorflow/tfjs-core';
import { GraphModel, loadGraphModel } from '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-cpu';

export interface ModelResult {
	languageId: string;
	confidence: number;
}

class InMemoryIOHandler implements io.IOHandler {

	constructor(private readonly modelJSON: io.ModelJSON,
		private readonly weights: ArrayBuffer) {
	}

	async load(): Promise<io.ModelArtifacts> {
		// We do not allow both modelTopology and weightsManifest to be missing.
		const modelTopology = this.modelJSON.modelTopology;
		const weightsManifest = this.modelJSON.weightsManifest;
		if (modelTopology === null && weightsManifest === null) {
			throw new Error(
				`The model contains neither model topology or manifest for weights.`);
		}

		return this.getModelArtifactsForJSON(
			this.modelJSON, (weightsManifest) => this.loadWeights(weightsManifest));
	}

	private async getModelArtifactsForJSON(
		modelJSON: io.ModelJSON,
		loadWeights: (weightsManifest: io.WeightsManifestConfig) => Promise<[
		  /* weightSpecs */ io.WeightsManifestEntry[], /* weightData */ ArrayBuffer
		]>): Promise<io.ModelArtifacts> {
		const modelArtifacts: io.ModelArtifacts = {
			modelTopology: modelJSON.modelTopology,
			format: modelJSON.format,
			generatedBy: modelJSON.generatedBy,
			convertedBy: modelJSON.convertedBy
		};

		if (modelJSON.trainingConfig !== null) {
			modelArtifacts.trainingConfig = modelJSON.trainingConfig;
		}
		if (modelJSON.weightsManifest !== null) {
			const [weightSpecs, weightData] =
				await loadWeights(modelJSON.weightsManifest);
			modelArtifacts.weightSpecs = weightSpecs;
			modelArtifacts.weightData = weightData;
		}
		if (modelJSON.signature !== null) {
			modelArtifacts.signature = modelJSON.signature;
		}
		if (modelJSON.userDefinedMetadata !== null) {
			modelArtifacts.userDefinedMetadata = modelJSON.userDefinedMetadata;
		}
		if (modelJSON.modelInitializer !== null) {
			modelArtifacts.modelInitializer = modelJSON.modelInitializer;
		}

		return modelArtifacts;
	}

	private async loadWeights(weightsManifest: io.WeightsManifestConfig): Promise<[io.WeightsManifestEntry[], ArrayBuffer]> {
		const weightSpecs = [];
		for (const entry of weightsManifest) {
			weightSpecs.push(...entry.weights);
		}

		return [weightSpecs, this.weights];
	}
}

export interface ModelOperationsOptions {
	modelJsonLoaderFunc?: () => Promise<{ [key:string]: any }>;
	weightsLoaderFunc?: () => Promise<ArrayBuffer>;
	minContentSize?: number;
	maxContentSize?: number;
	normalizeNewline?: boolean;
}

export class ModelOperations {
	private static DEFAULT_MAX_CONTENT_SIZE = 100000;
	private static DEFAULT_MIN_CONTENT_SIZE = 20;

	private static NODE_MODEL_JSON_FUNC: () => Promise<{ [key:string]: any }> = async () => {
		const fs = await import('fs');
		const path = await import('path');

		return new Promise<any>((resolve, reject) => {
			fs.readFile(path.join(__dirname, '..', '..', 'model', 'model.json'), (err, data) => {
				if(err) {
					reject(err);
					return;
				}
				resolve(JSON.parse(data.toString()));
			});
		});
	}

	private static NODE_WEIGHTS_FUNC: () => Promise<ArrayBuffer> = async () => {
		const fs = await import('fs');
		const path = await import('path');

		return new Promise<ArrayBuffer>((resolve, reject) => {
			fs.readFile(path.join(__dirname, '..', '..', 'model', 'group1-shard1of1.bin'), (err, data) => {
				if(err) {
					reject(err);
					return;
				}
				resolve(data.buffer);
			});
		});
	}

	private _model: GraphModel | undefined;
	private _modelJson: io.ModelJSON | undefined;
	private _weights: ArrayBuffer | undefined;
	private readonly _minContentSize: number;
	private readonly _maxContentSize: number;
	private readonly _modelJsonLoaderFunc: () => Promise<{ [key:string]: any }>;
	private readonly _weightsLoaderFunc: () => Promise<ArrayBuffer>;
	private readonly _normalizeNewline: boolean;

	constructor(modelOptions?: ModelOperationsOptions) {
		this._modelJsonLoaderFunc = modelOptions?.modelJsonLoaderFunc ?? ModelOperations.NODE_MODEL_JSON_FUNC;
		this._weightsLoaderFunc = modelOptions?.weightsLoaderFunc ?? ModelOperations.NODE_WEIGHTS_FUNC;
		this._minContentSize = modelOptions?.minContentSize ?? ModelOperations.DEFAULT_MIN_CONTENT_SIZE;
		this._maxContentSize = modelOptions?.maxContentSize ?? ModelOperations.DEFAULT_MAX_CONTENT_SIZE;
		this._normalizeNewline = modelOptions?.normalizeNewline ?? true;
	}

	private async getModelJSON(): Promise<io.ModelJSON> {
		if (this._modelJson) {
			return this._modelJson;
		}

		// TODO: validate model.json
		this._modelJson = await this._modelJsonLoaderFunc() as io.ModelJSON;
		return this._modelJson;
	}

	private async getWeights() {
		if (this._weights) {
			return this._weights;
		}

		// TODO: validate weights
		this._weights = await this._weightsLoaderFunc();
		return this._weights;
	}

	private async loadModel() {
		if (this._model) {
			return;
		}

		// These 2 env set's just suppress some warnings that get logged that
		// are not applicable for this use case.
		const tfEnv = env();
		tfEnv.set('IS_NODE', false);
		tfEnv.set('PROD', true);

		if(!(await setBackend('cpu'))) {
			throw new Error('Unable to set backend to CPU.');
		}

		const resolvedModelJSON = await this.getModelJSON();
		const resolvedWeights = await this.getWeights();
		this._model = await loadGraphModel(new InMemoryIOHandler(resolvedModelJSON, resolvedWeights));
	}

	public async runModel(content: string): Promise<Array<ModelResult>> {
		if (!content || content.length < this._minContentSize) {
			return [];
		}

		await this.loadModel();

		// larger files cause a "RangeError: Maximum call stack size exceeded" in tfjs.
		// So grab the first X characters as that should be good enough for guessing.
		if (content.length >= this._maxContentSize) {
			content = content.substring(0, this._maxContentSize);
		}

		if (this._normalizeNewline) {
			content = content.replace(/\r\n/g, '\n');
		}

		// call out to the model
		const predicted = await this._model!.executeAsync(tensor([content]));
		const probabilitiesTensor: Tensor<Rank> = Array.isArray(predicted) ? predicted[0]! : predicted;
		const languageTensor: Tensor<Rank> = Array.isArray(predicted) ? predicted[1]! : predicted;
		const probabilities = probabilitiesTensor.dataSync() as Float32Array;
		const langs: Array<string> = languageTensor.dataSync() as any;

		const objs: Array<ModelResult> = [];
		for (let i = 0; i < langs.length; i++) {
			objs.push({
				languageId: langs[i],
				confidence: probabilities[i],
			});
		}

		let maxIndex = 0;
		for (let i = 0; i < probabilities.length; i++) {
			if (probabilities[i] > probabilities[maxIndex]) {
				maxIndex = i;
			}
		}

		return objs.sort((a, b) => {
			return b.confidence - a.confidence;
		});
	}

	public dispose() {
		this._model?.dispose();
	}
}
