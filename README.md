# vscode-languagedetection

An npm package that uses machine learning to detect source code languages. Powered by [@yoeo](https://github.com/yoeo)'s [guesslang](https://github.com/yoeo/guesslang) model!

Usage:

First install it in your project:

```sh
npm install --save @vscode/vscode-languagedetection
# or using yarn
yarn add @vscode/vscode-languagedetection
```

Then instantiate a ModuleOperations and pass it in the `model.json` and `weights` file content:

> NOTE: This is only for VS Code. In the future, you shouldn't have to do this.

```ts
import { ModelJSON, ModelOperations } from "@vscode/vscode-languagedetection";

const modulOperations = new ModelOperations(async () => {
    return JSON.parse(readFileSync(join(__dirname, '..', '..', 'model', 'model.json')).toString()) as ModelJSON;
}, async () => {
    return readFileSync(join(__dirname, '..', '..', 'model', 'group1-shard1of1.bin')).buffer;
});

const result = await modulOperations.runModel(`
function makeThing(): Thing {
    let size = 0;
    return {
        get size(): number {
        return size;
        },
        set size(value: string | number | boolean) {
        let num = Number(value);
        // Don't allow NaN and stuff.
        if (!Number.isFinite(num)) {
            size = 0;
            return;
        }
        size = num;
        },
    };
}
`);
```

which will give you the following in order of confidence:
```ts
[
  { languageId: 'ts', confidence: 0.48307517170906067 },
  { languageId: 'rs', confidence: 0.10045434534549713 },
  { languageId: 'js', confidence: 0.07833506911993027 },
  { languageId: 'c', confidence: 0.045049071311950684 },
  { languageId: 'lua', confidence: 0.044198162853717804 },
  { languageId: 'cpp', confidence: 0.03847603127360344 },
  { languageId: 'cs', confidence: 0.03298814222216606 },
  { languageId: 'mm', confidence: 0.02999635599553585 },
  { languageId: 'html', confidence: 0.01874217577278614 },
  { languageId: 'sql', confidence: 0.01811739057302475 },
  { languageId: 'swift', confidence: 0.01418407540768385 },
  { languageId: 'pl', confidence: 0.014126052148640156 },
  { languageId: 'md', confidence: 0.01112559624016285 },
  { languageId: 'java', confidence: 0.009976979345083237 },
  { languageId: 'ps1', confidence: 0.009242385625839233 },
  { languageId: 'php', confidence: 0.008150739595293999 },
  { languageId: 'go', confidence: 0.0069260732270777225 },
  { languageId: 'tex', confidence: 0.006594990845769644 },
  { languageId: 'scala', confidence: 0.00619362760335207 },
  { languageId: 'py', confidence: 0.004240741487592459 },
  { languageId: 'r', confidence: 0.0033439004328101873 },
  { languageId: 'matlab', confidence: 0.0030552551615983248 },
  { languageId: 'css', confidence: 0.0026798006147146225 },
  { languageId: 'sh', confidence: 0.0023688252549618483 },
  { languageId: 'ipynb', confidence: 0.002114647999405861 },
  { languageId: 'bat', confidence: 0.0018151027616113424 },
  { languageId: 'hs', confidence: 0.001677449094131589 },
  { languageId: 'erl', confidence: 0.0014191442169249058 },
  { languageId: 'coffee', confidence: 0.000696933304425329 },
  { languageId: 'rb', confidence: 0.0006357143283821642 }
]
```

## Local development

To build from source, follow these steps:

1. Clone the repository
2. Run `npm install`
3. Run `npm run watch`

To run the tests, simply run `npm test`.

To build a production package:

1. Run `npm run build`
2. Run `npm pack`

To publish this package, run `npm publish`.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
