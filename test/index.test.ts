import { expect } from "chai";
import { readFileSync } from "fs";
import path from "path";
import { ModelOperations, ModelResult } from "../lib/index.node.js";

const expectedRelativeConfidence = 0.2;

async function arrayify(generator: Generator<string, any, unknown>) {
	const langs: string[] = [];
	for await (const lang of generator) {
		langs.push(lang);
	}
	return langs;
}

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

			// Handle languages that are close enough to each other
			if ((currentHighest.languageId === 'ts' && current.languageId === 'js')
				|| (currentHighest.languageId === 'js' && current.languageId === 'ts')
				|| (currentHighest.languageId === 'c' && current.languageId === 'cpp')
				|| (currentHighest.languageId === 'cpp' && current.languageId === 'c')) {
				continue;
			}

			return;
		}
	}
}

describe('describe', () => {
	const modulOperations = new ModelOperations();
	
	it('test TypeScript', async () => {
		const result = await modulOperations.runModel(`
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(new ValidationPipe());

	await app.listen(3000);
	console.log(\`Application is running on: \${await app.getUrl()}\`);
}
bootstrap();
`);

		expect(result[0].languageId).to.equal('ts');
		expect(result[0].confidence).to.greaterThan(expectedRelativeConfidence);

		const langs: string[] = await arrayify(runVSCodeHeuristic(result));
		expect(langs.length).to.equal(1);
		expect(langs[0]).to.equal('ts');
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
		const langs: string[] = await arrayify(runVSCodeHeuristic(result));
		expect(langs.length).to.equal(1);
		expect(langs[0]).to.equal('py');
	});

	it('test Java', async () => {
		const result = await modulOperations.runModel(`
public class Main {

	public static void main(String[] args) {
		int num = 29;
		boolean flag = false;
		for (int i = 2; i <= num / 2; ++i) {
			// condition for nonprime number
			if (num % i == 0) {
				flag = true;
				break;
			}
		}
	
		if (!flag)
			System.out.println(num + " is a prime number.");
		else
			System.out.println(num + " is not a prime number.");
	}
}
`);
		expect(result[0].languageId).to.equal('java');
		expect(result[0].confidence).to.greaterThan(expectedRelativeConfidence);
		const langs: string[] = await arrayify(runVSCodeHeuristic(result));
		expect(langs.length).to.equal(1);
		expect(langs[0]).to.equal('java');
	});

	it('test PowerShell', async () => {
		const result = await modulOperations.runModel(`
$msedgedriverPath = 'C:\\Users\\Tyler\\Downloads\\edgedriver_win64\\msedgedriver.exe'

$Driver = Start-SeNewEdge -BinaryPath $msedgedriverPath -StartURL https://seattle.signetic.com/home

Start-Sleep -Seconds 5

while($true) {
	$element = Find-SeElement -Driver $Driver -ClassName text-demibold

	if (!$element -or $element.Text -ne 'No appointments available') {
		# notify
		New-BurntToastNotification -Text 'Check website'
		break
	} else {
		Write-Host 'no appointments available'
	}

	Enter-SeUrl https://seattle.signetic.com/home -Driver $Driver
	Start-Sleep -Seconds 2
}
`);
		expect(result[0].languageId).to.equal('ps1');
		expect(result[0].confidence).to.greaterThan(expectedRelativeConfidence);
		const langs: string[] = await arrayify(runVSCodeHeuristic(result));
		expect(langs.length).to.equal(1);
		expect(langs[0]).to.equal('ps1');
	});

	it('test large file', async () => {
		const result = await modulOperations.runModel(readFileSync(path.resolve(__dirname, '..', '..', 'test', 'large.ts.txt')).toString());

		expect(result[0].languageId).to.equal('ts');
		expect(result[0].confidence).to.greaterThan(expectedRelativeConfidence);

		const langs: string[] = await arrayify(runVSCodeHeuristic(result));
		expect(langs.length).to.equal(1);
		expect(langs[0]).to.equal('ts');
	});

	it('test Visual Basic', async () => {
		const result = await modulOperations.runModel(`
Module Module1

Sub Main()
	Dim id As Integer
	Dim name As String = "Suresh Dasari"
	Dim percentage As Double = 10.23
	Dim gender As Char = "M"c
	Dim isVerified As Boolean

	id = 10
	isVerified = True
	Console.WriteLine("Id:{0}", id)
	Console.WriteLine("Name:{0}", name)
	Console.WriteLine("Percentage:{0}", percentage)
	Console.WriteLine("Gender:{0}", gender)
	Console.WriteLine("Verfied:{0}", isVerified)
	Console.ReadLine()
End Sub

End Module
`);

		expect(result[0].languageId).to.equal('vba');
		expect(result[0].confidence).to.greaterThan(expectedRelativeConfidence);

		for await (const lang of runVSCodeHeuristic(result)) {
			expect(lang).to.equal('vba');
		}
	});

	it('test results with carriage returns', async () => {
		const result = await modulOperations.runModel(`public class Reverse {\r\n\r\n  public static void main(String[] args) {\r\n    String sentence = "Go work";\r\n    String reversed = reverse(sentence);\r\n    System.out.println("The reversed sentence is: " + reversed);\r\n  }\r\n\r\n  public static String reverse(String sentence) {\r\n    if (sentence.isEmpty())\r\n      return sentence;\r\n\r\n    return reverse(sentence.substring(1)) + sentence.charAt(0);\r\n  }\r\n}`);
		expect(result[0].languageId).to.equal('java');
		expect(result[0].confidence).to.greaterThan(expectedRelativeConfidence);
		const langs: string[] = await arrayify(runVSCodeHeuristic(result));
		expect(langs.length).to.equal(1);
		expect(langs[0]).to.equal('java');
	});

});
