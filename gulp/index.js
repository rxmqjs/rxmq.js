import fs from 'fs';
import gulp from 'gulp';

// blacklist self and utils folder
const blacklist = ['index.js'];
// get local files
const files = fs.readdirSync('./gulp').filter(f => blacklist.indexOf(f) === -1);

// load custom tasks
files.forEach(file => require(`./${file}`).default(gulp));

gulp.task('default', ['build']);
