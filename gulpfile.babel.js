let gulp = require('gulp');
let babel = require('gulp-babel');
let rollup = require('gulp-rollup');
let rename = require('gulp-rename');
let uglify = require('gulp-uglify');

gulp.task('build', function() {
	return gulp.src('src/register.js', {read: false, base: './'})
		.pipe(rollup({}))
		.pipe(rename('babylon.objloader.es6.js'))
        .pipe(gulp.dest('dist'))
		.pipe(babel())
		.pipe(rename('babylon.objloader.js'))
		.pipe(gulp.dest('dist'))
		;
});

gulp.task('cjs', function() {
	gulp.src('src/babylon.objloader.js')
		.pipe(babel())
		.pipe(rename('cjs.js'))
		.pipe(gulp.dest('dist'))
});

gulp.task('default', ['build', 'cjs']);
