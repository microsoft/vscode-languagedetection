import { expect } from "chai";
import { readFileSync } from "fs";
import { join } from "path";
import { ModelOperations } from "../lib";

describe('describe', () => {
	const modulOperations = new ModelOperations(async () => {
		return JSON.parse(readFileSync(join(__dirname, '..', '..', 'model', 'model.json')).toString());
	}, async () => {
		return readFileSync(join(__dirname, '..', '..', 'model', 'group1-shard1of1.bin')).buffer;
	});
	
	it('test TypeScript', async () => {
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
		expect(result[0].languageId).to.equal('ts');
		expect(result[0].confidence).to.greaterThan(.4);
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
		expect(result[0].confidence).to.greaterThan(.4);
	});
});
