import { GraphModel, io, loadGraphModel, Rank, setBackend, tensor, Tensor } from '@tensorflow/tfjs';

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

export class ModelOperations {
	private _model: GraphModel | undefined;
	private _modelJson: io.ModelJSON | undefined;
	private _weights: ArrayBuffer | undefined;

	constructor(private readonly modelJSONFunc: () => Promise<any>,
		private readonly weightsFunc: () => Promise<ArrayBuffer>) {
	}

	private async getModelJSON() {
		if (this._modelJson) {
			return this._modelJson;
		}
		this._modelJson = await this.modelJSONFunc() as io.ModelJSON;
		return this._modelJson;
	}

	private async getWeights() {
		if (this._weights) {
			return this._weights;
		}
		this._weights = await this.weightsFunc();
		return this._weights;
	}

	private async loadModel() {
		if (this._model) {
			return;
		}

		await setBackend('cpu');

		const resolvedModelJSON = await this.getModelJSON();
		const resolvedWeights = await this.getWeights();
		this._model = await loadGraphModel(new InMemoryIOHandler(resolvedModelJSON, resolvedWeights));
	}

	public async runModel(content: string): Promise<Array<ModelResult>> {
		if (!content) {
			return [];
		}

		await this.loadModel();

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
