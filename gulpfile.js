var gulp        = require('gulp');
var gutil       = require('gulp-util');
var source      = require('vinyl-source-stream');
var babelify    = require('babelify');
var watchify    = require('watchify');
var uglify      = require('gulp-uglify');
var rename      = require('gulp-rename');
var exorcist    = require('exorcist');
var browserify  = require('browserify');
var browserSync = require('browser-sync').create();

// Watchify args contains necessary cache options to achieve fast incremental bundles.
// See watchify readme for details. Adding debug true for source-map generation.
watchify.args.debug = true;
// Input file.
var bundler = watchify(browserify('./app/js/app.js', watchify.args));

// Babel transform
bundler.transform(babelify.configure({
    sourceMapRelative: 'app/js',
    presets: ["es2015"]
}));

// On updates recompile
bundler.on('update', bundle);

function bundle() {

    gutil.log('Compiling JS...');

    return bundler.bundle()
        .on('error', function (err) {
            gutil.log(err.message);
            browserSync.notify("Browserify Error!");
            this.emit("end");
        })
        .pipe(exorcist('app/js/dist/bundle.js.map'))
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./app/js/dist'))
        .pipe(browserSync.stream({once: true}));
}
gulp.task('minify', ['bundle'], function () {

    gulp.src(['app/js/dist/bundle.js'])
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest("./app/js/dist"));
});
/**
 * Gulp task alias
 */
gulp.task('bundle', function () {
    return bundle();
});

gulp.task('copy', function () {
    gulp.src("node_modules/color-name-list/dist/*").pipe(gulp.dest('assets/vendor/color-name-list/'));
});

/**
 * First bundle, then serve from the ./app directory
 */
gulp.task('default', ['bundle'], function () {
    browserSync.init({
        server: "./"
    });
});