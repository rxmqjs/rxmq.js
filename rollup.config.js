import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');
const external = Object.keys(pkg.dependencies);

export default {
    entry: './index.js',
    dest: pkg.main,
    format: 'umd',
    moduleName: 'rxmq',
    exports: 'named',
    sourceMap: true,
    plugins: [babel()],
    external,
};
