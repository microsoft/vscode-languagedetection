import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import typescript from '@rollup/plugin-typescript'
import * as path from 'path'
import { fileURLToPath } from 'node:url'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'
import replace from '@rollup/plugin-replace'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TSCONFIG = path.resolve(__dirname, 'tsconfig.esm.json')

const isProduction = process.env.NODE_ENV === 'production'

export default rollup.defineConfig([{
  input: {
    index: './lib/index.node.ts'
  },
  output: [{
    sourcemap: true,
    format: 'umd',
    dir: 'dist/lib',
    name: 'vscode-languagedetection',
    entryFileNames: '[name].js'
  }],
  plugins: [
    nodeResolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      mainFields: ['main', 'module'],
      preferBuiltins: true
    }),
    typescript({
      sourceMap: true,
      noEmitOnError: true,
      tsconfig: TSCONFIG
    }),
    commonjs({
      ignore: ['stream', 'http', 'url', 'punycode', 'https', 'zlib', 'util'],
    }),
    json(),
    terser({
      compress: isProduction,
      mangle: isProduction,
      format: {
        comments: false
      },
      ecma: 2015
    })
  ]
}, {
  input: {
    index: './lib/index.node.ts'
  },
  output: [{
    sourcemap: true,
    format: 'esm',
    dir: 'dist/lib',
    entryFileNames: '[name].esm.js'
  }],
  plugins: [
    nodeResolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      browser: false,
      preferBuiltins: true
    }),
    typescript({
      sourceMap: true,
      noEmitOnError: true,
      tsconfig: TSCONFIG
    }),
    commonjs(),
    json()
  ]
}, {
  cache: false,
  input: {
    index: './lib/index.ts'
  },
  output: [{
    sourcemap: true,
    format: 'esm',
    dir: 'dist/lib',
    entryFileNames: '[name].web.js'
  }],
  plugins: [
    nodeResolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      browser: true,
      preferBuiltins: true
    }),
    typescript({
      sourceMap: true,
      noEmitOnError: true,
      tsconfig: TSCONFIG
    }),
    commonjs(),
    json(),
    replace({
      preventAssignment: true,
      'env().global.fetch != null': true // to remove the use of node-fetch in the browser
    })
  ]
}])
