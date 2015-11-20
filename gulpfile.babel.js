let gulp = require('gulp');
let babel = require('gulp-babel');
let rollup = require('gulp-rollup');
let rename = require('gulp-rename');
let uglify = require('gulp-uglify');
let browserify = require('browserify');
let fs = require('fs');
let source = require('vinyl-source-stream');
let buffer = require('vinyl-buffer');

gulp.task('build-es6', function() {
    return gulp.src('src/register.js', {read: false, base: './'})
    .pipe(rollup({}))
    .pipe(rename('babylon.objloader.es6.js'))
    .pipe(gulp.dest('dist'))
});

gulp.task('cjs', ['build-es6'], function() {
    return gulp.src('dist/babylon.objloader.es6.js')
    .pipe(babel())
    .pipe(rename('cjs.js'))
    .pipe(gulp.dest('dist'))
});

gulp.task('build-browser', ['cjs'], function() {
    return browserify('./dist/cjs.js').bundle()
    .pipe(source('babylon.objloader.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist'))
});

gulp.task('build', ['build-es6', 'cjs', 'build-browser']);

gulp.task('default', ['build']);
