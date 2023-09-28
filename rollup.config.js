import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import deleteDist from 'rollup-plugin-delete';
import filesize from 'rollup-plugin-filesize';
import { dts } from 'rollup-plugin-dts';
import { babel } from '@rollup/plugin-babel';

import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.ts',
    external: ['react', 'react-dom'],
    output: {
      name: 'demo',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [
      deleteDist({ targets: 'dist/*' }),
      resolve(),
      typescript(),
      babel({
        exclude: /node_modules/,
        extensions: ['.ts', '.tsx', 'js', 'jsx'],
        // 运行时基础库
        babelHelpers: 'runtime',
      }),
      commonjs(),
      terser(),
      filesize(),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/index.ts',
    external: ['react', 'react-dom'],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
    plugins: [
      resolve(),
      typescript(),
      babel({
        exclude: /node_modules/,
        extensions: ['.ts', '.tsx', 'js', 'jsx'],
        // 运行时基础库
        babelHelpers: 'runtime',
      }),
      commonjs(),
      filesize(),
    ],
  },

  // d.ts
  {
    input: 'src/types.ts',
    output: [{ file: pkg.types, format: 'es' }],
    plugins: [dts()],
  },
];
