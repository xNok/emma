import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/emma-forms.js',
      format: 'iife',
      name: 'EmmaForms',
      sourcemap: true,
    },
    {
      file: 'dist/emma-forms.min.js',
      format: 'iife',
      name: 'EmmaForms',
      sourcemap: true,
      plugins: [terser()],
    },
    {
      file: 'dist/emma-forms.esm.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      sourceMap: true,
    }),
    filesize(),
  ],
};
