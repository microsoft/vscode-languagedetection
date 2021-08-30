{
  "name": "@vscode/vscode-languagedetection",
  "version": "1.0.21",
  "description": "An npm package that uses guesslang's ML model to detect source code languages",
  "main": "dist/lib/index.js",
  "bin": {
    "vscode-languagedetection": "cli/index.js"
  },
  "module": "dist/lib/index.js",
  "types": "dist/lib/index.d.ts",
  "scripts": {
    "pretest": "npm run clean && tsc --build ./test",
    "prepublish": "npm test && npm run build",
    "prepack": "npm run build",
    "clean": "rimraf dist",
    "watch": "npm run clean && webpack --watch",
    "test": "mocha --recursive dist/test/**/*.test.js",
    "build": "npm run clean && webpack --mode production"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/microsoft/vscode-languagedetection.git"
  },
  "author": "Tyler Leonhardt",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/microsoft/vscode-languagedetection/issues"
  },
  "homepage": "https://github.com/microsoft/vscode-languagedetection#readme",
  "devDependencies": {
    "@tensorflow/tfjs-backend-cpu": "^3.9.0",
    "@tensorflow/tfjs-converter": "^3.9.0",
    "@tensorflow/tfjs-core": "^3.9.0",
    "@types/chai": "^4.2.21",
    "@types/mocha": "8.2.3",
    "@types/node": "^16.3.1",
    "chai": "^4.3.4",
    "esbuild": "^0.12.15",
    "mocha": "9.0.2",
    "node-fetch": "^2.6.1",
    "npm-run-all": "^4.1.5",
    "rimraf": "3.0.2",
    "terser-webpack-plugin": "^5.1.4",
    "ts-loader": "^9.2.3",
    "typescript": "^4.3.5",
    "webpack": "~5.44.0",
    "webpack-cli": "^4.7.2"
  }
}
