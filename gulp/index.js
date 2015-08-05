import fs from 'fs';
import gulp from 'gulp';

// blacklist self and utils folder
const blacklist = ['index.js'];
// get local files
const files = fs.readdirSync('./gulp').filter(f => !blacklist.includes(f));

// load custom tasks
files.forEach(function(file) {
    require('./' + file)(gulp);
});

gulp.task('default', ['build']);
