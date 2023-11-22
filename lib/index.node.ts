import { ModelOperations, ModelOperationsOptions } from './index';
export * from './index'

type NodeModelOperationsOptions = Omit<ModelOperationsOptions, 'modelJsonLoaderFunc' | 'weightsLoaderFunc'> & Partial<ModelOperationsOptions>

class NodeModelOperations extends ModelOperations {
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

	constructor(modelOptions?: NodeModelOperationsOptions) {
		super({
			modelJsonLoaderFunc: modelOptions?.modelJsonLoaderFunc ?? NodeModelOperations.NODE_MODEL_JSON_FUNC,
			weightsLoaderFunc: modelOptions?.weightsLoaderFunc ?? NodeModelOperations.NODE_WEIGHTS_FUNC,
			...modelOptions
		})
	}
}

export {
	NodeModelOperations as ModelOperations
}
