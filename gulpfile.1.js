var gulp = require('gulp'),
    sass = require('gulp-sass'),
    concat = require("gulp-concat"),
    merge = require('merge-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    cleanCss = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    expect = require('gulp-expect-file'),
    uglify = require('gulp-uglify'),
    del = require('del'),
    browserSync = require("browser-sync").create(),

    babelify = require('babelify'),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    coffeeify = require('coffeeify'),
    gutil = require('gulp-util'),
    livereload = require('gulp-livereload'),
    source = require('vinyl-source-stream'),
    watchify = require('watchify');

var config = {
    js: {
        src: './src/_js/main.js',       // Entry point
        outputDir: './src/_bundle/',  // Directory to save bundle to
        mapDir: './src/_maps/',      // Subdirectory to save maps to
        outputFile: 'bundle.js' // Name to use for bundle
    },
};

// This method makes it easy to use common bundling options in different tasks
function bundle(bundler) {

    // Add options to add to "base" bundler passed as parameter
    bundler
        .bundle()                                                        // Start bundle
        .pipe(source(config.js.src))                        // Entry point
        .pipe(buffer())                                               // Convert to gulp pipeline
        .pipe(rename(config.js.outputFile))          // Rename output from 'main.js'
        //   to 'bundle.js'
        .pipe(sourcemaps.init({ loadMaps: true }))  // Strip inline source maps
        .pipe(sourcemaps.write(config.js.mapDir))    // Save source maps to their
        //   own directory
        .pipe(gulp.dest(config.js.outputDir))        // Save 'bundle' to build/
        .pipe(livereload());                                       // Reload browser if relevant
}

gulp.task('bundle', function () {
    var bundler = browserify(config.js.src)  // Pass browserify the entry point
        .transform(coffeeify)      //  Chain transformations: First, coffeeify . . .
        .transform(babelify, { presets: ['es2015'] });  // Then, babelify, with ES2015 preset

    bundle(bundler);  // Chain other options -- sourcemaps, rename, etc.
})

gulp.task('styles', function () {
    return gulp.src([
        'src/_scss/*.scss'
    ])
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer({
            browsers: [
                'Chrome >= 35',
                'Firefox >= 38',
                'Edge >= 12',
                'Explorer >= 10',
                'iOS >= 8',
                'Safari >= 8',
                'Android 2.3',
                'Android >= 4',
                'Opera >= 12']
        })]))
        .pipe(concat("style.css"))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('assets/css/'))
        .pipe(cleanCss())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('assets/css/'))
        .pipe(browserSync.stream());
});

function handleError(error) {
    console.log(error.toString())
    this.emit('end')
}

gulp.task('copy', function () {
    gulp.src("node_modules/color-name-list/dist/*").pipe(gulp.dest('assets/vendor/color-name-list/'));
    // gulp.src("node_modules/fuse.js/dist/*").pipe(gulp.dest('assets/vendor/fuse/'));
    // gulp.src("node_modules/nearest-color/nearestColor.js").pipe(gulp.dest('assets/vendor/nearest-color/'));
    // gulp.src("node_modules/handlebars/dist/").pipe(gulp.dest('assets/vendor/handlebars/'));
});

gulp.task("scripts", function () {
    var files = [
        "node_modules/fuse.js/dist/fuse.js",
        "node_modules/nearest-color/nearestColor.js",
        "node_modules/handlebars/dist/handlebars.js",
        //"src/_js/**/*.js"
        "src/_bundle/bundle.js"
    ];

    var bundle = browserify(config.js.src)  // Pass browserify the entry point
        .transform(coffeeify)      //  Chain transformations: First, coffeeify . . .
        .transform(babelify, { presets: ['es2015'] });  // Then, babelify, with ES2015 preset

    return bundle.bundle()                                                        // Start bundle
    .pipe(source(config.js.src))                        // Entry point
    .pipe(buffer())                                               // Convert to gulp pipeline
    .pipe(rename(config.js.outputFile))          // Rename output from 'main.js'
    //   to 'bundle.js'
    .pipe(sourcemaps.init({ loadMaps: true }))  // Strip inline source maps
    .pipe(sourcemaps.write(config.js.mapDir))    // Save source maps to their
    //   own directory
    .pipe(gulp.dest(config.js.outputDir))
        .pipe(src(files))
        .pipe(expect(files))
        .on('error', handleError)
        .pipe(concat("scripts.js"))
        .pipe(gulp.dest("assets/js/"))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest("assets/js/"))
        .pipe(browserSync.stream());
});

gulp.task('watch', ['styles'], function () {
    gulp.watch(['src/_scss/**/*.scss'], ['styles']);
    gulp.watch(['src/_js/**/*.js'], ['bundle']);
    //gulp.watch(['src/_js/**/*.js'], ['bundle','scripts']);
});

gulp.task(
    "live", ["watch", "bundle", "scripts", "styles"],
    function () {
        browserSync.init({
            server: {
                baseDir: "./"
            }
        });

        gulp.watch("src/_scss/**/*.scss", ["watch"]);
        gulp.watch("src/_js/**/*.js", ["watch"]);
        gulp.watch("**/*.html").on("change", browserSync.reload);
    });

gulp.task('clean', function () {
    return del(["assets", "vendor"]);
});

gulp.task("default", ["styles", "scripts"], function () {
}); 