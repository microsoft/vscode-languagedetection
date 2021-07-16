'use strict';

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (env, argv) {
	const mode = argv.mode || 'none';
	return {
		entry: {
			'index': './lib/index.ts'
		},
		mode: mode,
		target: 'node',
		devtool: 'source-map',
		output: {
			filename: '[name].js',
			path: path.resolve(__dirname, 'dist', 'lib'),
			library: {
				name: 'vscode-languagedetection',
				type: 'umd',
			},
			globalObject: 'this'
		},
		optimization: {
			minimizer: [
				new TerserPlugin({
					parallel: true,
					terserOptions: {
						ecma: 6,
						compress: mode === 'production',
						mangle: mode === 'production',
						output: {
							beautify: mode !== 'production',
							comments: false,
							ecma: 6,
						},
					},
				}),
			],
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: {
						loader: 'ts-loader',
						options: {
							experimentalWatchApi: true,
						},
					},
					exclude: /\.d\.ts$/,
				},
			],
		},
		resolve: {
			extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
			alias: {
				'@tensorflow/tfjs': path.resolve(__dirname, 'node_modules', '@tensorflow', 'tfjs', 'dist', 'tf.es2017.js'),
			},
		},
		stats: {
			preset: 'errors-warnings',
			assets: true,
			colors: true,
			env: true,
			errorsCount: true,
			warningsCount: true,
			timings: true,
		},
	};
};
