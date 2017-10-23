import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');
const globals = {'rxjs/Rx': 'Rx'};
const external = Object.keys(pkg.dependencies).concat(['rxjs/Rx']);

export default {
  input: './index.js',
  output: {
    file: pkg.main,
    format: 'umd',
    exports: 'named',
  },
  globals,
  name: 'rxmq',
  sourcemap: true,
  plugins: [babel()],
  external,
};
