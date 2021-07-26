import { expect } from "chai";
import { readFileSync } from "fs";
import { join } from "path";
import { ModelOperations, ModelResult } from "../lib";

const expectedRelativeConfidence = 0.2;

// Similar to the heuristic used in VS Code:
function * runVSCodeHeuristic(modelResults: ModelResult[]) {
	if (!modelResults) {
		return;
	}

	if (modelResults[0].confidence < expectedRelativeConfidence) {
		return;
	}

	const possibleLanguages: ModelResult[] = [modelResults[0]];

	for (let current of modelResults) {

		if (current === modelResults[0]) {
			continue;
		}

		const currentHighest = possibleLanguages[possibleLanguages.length - 1];

		if (currentHighest.confidence - current.confidence >= expectedRelativeConfidence) {
			while (possibleLanguages.length) {
				yield possibleLanguages.shift()!.languageId;
			}
			if (current.confidence > expectedRelativeConfidence) {
				possibleLanguages.push(current);
				continue;
			}
			return;
		} else {
			if (current.confidence > expectedRelativeConfidence) {
				possibleLanguages.push(current);
				continue;
			}
			return;
		}
	}
}

describe('describe', () => {
	const modulOperations = new ModelOperations(async () => {
		return JSON.parse(readFileSync(join(__dirname, '..', '..', 'model', 'model.json')).toString());
	}, async () => {
		return readFileSync(join(__dirname, '..', '..', 'model', 'group1-shard1of1.bin')).buffer;
	});
	
	it('test TypeScript', async () => {
		const result = await modulOperations.runModel(`
type User = {
	name: string;
	age: number;
};

function isAdult(user: User): boolean {
	return user.age >= 18;
}

const justine: User = {
	name: 'Justine',
	age: 'Secret!',
};

const isJustineAnAdult: string = isAdult(justine, "I shouldn't be here!");
`);

		expect(result[0].languageId).to.equal('ts');
		expect(result[0].confidence).to.greaterThan(expectedRelativeConfidence);

		for await (const lang of runVSCodeHeuristic(result)) {
			expect(lang).to.equal('ts');
		}
	});

	it('test Python', async () => {
		const result = await modulOperations.runModel(`
		# Python program to check if the input number is odd or even.
		# A number is even if division by 2 gives a remainder of 0.
		# If the remainder is 1, it is an odd number.
		
		num = int(input("Enter a number: "))
		if (num % 2) == 0:
			print("{0} is Even".format(num))
		else:
			print("{0} is Odd".format(num))
`);
		expect(result[0].languageId).to.equal('py');
		expect(result[0].confidence).to.greaterThan(expectedRelativeConfidence);
		for await (const lang of runVSCodeHeuristic(result)) {
			expect(lang).to.equal('py');
		}
	});
});
