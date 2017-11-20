
var gulp = require('gulp');
var babel = require('gulp-babel');
var watch = require('gulp-watch');
var watchify = require('gulp-watchify');
var sourcemap = require('gulp-sourcemaps')


var jsxpath = 'lib/modules/**/*.jsx';
var jsxoutput = 'lib/babel-build/';
var bundleoutput = 'lib/js-build/';
var entries = [
    ['viewer'],
];


gulp.task('babel-build', function () {
    process.env.NODE_ENV = 'production'
    return gulp.src(jsxpath)
        .pipe(babel({
            presets: ['es2015', 'react']
        }))
        .pipe(gulp.dest(jsxoutput));
});

gulp.task('babel-debug-build', function () {
    return gulp.src(jsxpath)
        .pipe(sourcemap.init())
        .pipe(watch(jsxpath))
        .pipe(babel({
            presets: ['es2015', 'react'],
        }))
        .on('error', function (err) {
            console.log(err);
            return true;
        })
        .pipe(sourcemap.write())
        .pipe(gulp.dest(jsxoutput));
});


var source = require('vinyl-source-stream')
var streamify = require('gulp-streamify')
var browserify = require('browserify')
var uglify = require('gulp-uglify')
var minify = require('gulp-minify')
var rename = require('gulp-rename')


gulp.task('bundle', ['babel-build'], function () {
    process.env.NODE_ENV = 'production'
    for (var i in entries) {
        var dir = entries[i][0];
        var shouldUglify = entries[i][1] !== 'no-uglify';
        var filename = 'index.js';
        var stub = browserify('./' + jsxoutput + dir + '/' + filename)
            .bundle()
            .pipe(source(filename));

        var minified = uglify() 
        if (shouldUglify) {
            stub = stub.pipe(streamify(minified));
        }
        stub.pipe(gulp.dest(bundleoutput + dir));
    }
});

gulp.task('debug-bundle', watchify(function (watchify) {
    return gulp.src(jsxoutput + '**/index.js')
        .pipe(watchify({watch: true}))
        .on('error', function () {
            return true;
        })
        .on('finish', function () {
            console.log('building finished');
        })
        .pipe(gulp.dest(bundleoutput));
}));


gulp.task('build', ['babel-build', 'bundle'], function () {
    console.log('构建完成，正在努力打包脚本');
});
gulp.task('debug-build', ['babel-debug-build', 'debug-bundle']);

