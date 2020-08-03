import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'lib',
        format: 'cjs',
      },
    ],
    external: ['atom', 'fs', 'path', 'os'],
    plugins: [
      babel({
        extensions: ['.ts'],
        babelHelpers: 'bundled',
      }),
      resolve({ extensions: ['.js', '.ts'], preferBuiltins: true }),
      commonjs(),
    ],
  },
]
