import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');
const external = Object.keys(pkg.dependencies).concat(['rxjs/Rx']);

export default {
  input: './index.js',
  output: {
    file: pkg.main,
    name: 'rxmq',
    format: 'umd',
    exports: 'named',
    sourcemap: true,
  },
  plugins: [babel()],
  external,
};
