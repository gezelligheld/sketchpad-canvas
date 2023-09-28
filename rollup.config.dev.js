import serve from 'rollup-plugin-serve';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import deleteDist from 'rollup-plugin-delete';

export default {
  input: 'demo/index.tsx',
  output: {
    name: 'demo',
    file: 'dist/index.js',
    format: 'iife', // 自执行函数，适用于 <script> 标签
    sourcemap: true,
  },
  plugins: [
    deleteDist({ targets: 'dist/*' }),
    resolve(),
    commonjs({
      namedExports: {
        // This is needed because react/jsx-runtime exports jsx on the module export.
        // Without this mapping the transformed import import {jsx as _jsx} from 'react/jsx-runtime' will fail.
        'react/jsx-runtime': ['jsx', 'jsxs'],
      },
    }),
    typescript(),
    serve({
      open: true, // 是否打开浏览器
      contentBase: './', // 入口 html 文件位置
      historyApiFallback: true, // 设置为 true 返回 index.html 而不是 404
      host: 'localhost', //
      port: 8000, // 端口号
    }),
  ],
};
