import { expect } from "chai";
import { readFileSync } from "fs";
import { join } from "path";
import { ModelJSON, ModelOperations } from "../lib";

describe('describe', () => {
    const modulOperations = new ModelOperations(async () => {
        return JSON.parse(readFileSync(join(__dirname, '..', '..', 'model', 'model.json')).toString()) as ModelJSON;
    }, async () => {
        return readFileSync(join(__dirname, '..', '..', 'model', 'group1-shard1of1.bin')).buffer;
    });
    
    it('test Typescript', async () => {
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
        console.log(result);
        expect(result[0].languageId).to.equal('ts');
        expect(result[0].confidence).to.greaterThan(.4);
    });
});
