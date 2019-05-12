var gulp = require('gulp')
var browserSync = require('browser-sync').create() 
var sass = require('gulp-sass')
var order = require('gulp-order')
var concat = require('gulp-concat')
var rename = require('gulp-rename')
var uglify = require('gulp-uglify')
var postcss = require('gulp-postcss')
var flexibility = require('postcss-flexibility')
var autoprefixer = require('autoprefixer')
var cssnano = require('cssnano')
var del = require('del')

gulp.task('clean', function(done) {
  return del([
    'src/css/**',
    'src/js/**'
  ])
});

// move the vendor stuff into our project
gulp.task('move-bootstrap-sass', function(){
  return gulp.src('node_modules/bootstrap/scss/**')
    .pipe(gulp.dest('src/assets/sass/libs/bootstrap'))
});

gulp.task('move-responsive-sass', function(){
  return gulp.src('node_modules/responsive-tools/dist/*.scss')
    .pipe(gulp.dest('src/assets/sass/libs'))
});

gulp.task('move-fa-sass', function(){
  return gulp.src('node_modules/font-awesome/scss/*')
    .pipe(gulp.dest('src/assets/sass/libs/font-awesome'))
});

gulp.task('move-fa-fonts', function(){
  return gulp.src('node_modules/font-awesome/fonts/*')
    .pipe(gulp.dest('src/fonts'))
});

gulp.task('move-fa-fonts-assets', function(){
  return gulp.src('node_modules/font-awesome/fonts/*')
    .pipe(gulp.dest('src/assets/sass/libs/fonts'))
});

// move the minimized versions of vendor javascript into our project
gulp.task('move-js', function() {
  return gulp.src([
    'node_modules/jquery/dist/jquery.min.js',
    // 'node_modules/bootstrap/dist/js/bootstrap.min.js',
    // 'node_modules/popper.js/dist/umd/popper.min.js',
    // 'node_modules/flexibility/flexibility.js',
    // 'node_modules/responsive-nav/responsive-nav.min.js',
    'node_modules/responsive-tools/dist/breakpoints.min.js',
    'node_modules/responsive-tools/dist/browser.min.js',
    'node_modules/jquery.scrollex/jquery.scrollex.min.js'
  ])
    .pipe(gulp.dest('src/assets/js/libs'))
});

gulp.task('move-stuff',
  gulp.series('move-js',
    gulp.parallel(
      'move-bootstrap-sass',
      'move-responsive-sass',
      'move-fa-sass',
      'move-fa-fonts',
      'move-fa-fonts-assets'
    )
  )
);

// compile sass same as running this from commandline:
// sass 'node_modules/bootstrap/scss/bootstrap.scss src/scss/*.scss' src/css
gulp.task('compile-sass', function() {
  const plugins = [ autoprefixer({browsers: ['last 2 versions','ie 9']}), cssnano() ];
  return gulp.src([
    'src/assets/sass/libs/bootstrap/bootstrap.scss', 
    'src/assets/sass/libs/font-awesome/font-awesome.scss',
    'src/assets/sass/libs/*.scss',
    'src/assets/sass/*.scss'
  ])
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([flexibility]))
    .pipe(gulp.dest('src/css'))
    .pipe(postcss(plugins))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('src/css'))
    // .pipe(browserSync.reload({stream:true}));
    .pipe(browserSync.stream())
});

gulp.task('concat-js', function() {
  var glob = [];
  glob.push('src/assets/js/libs/*.js')
  glob.push('src/assets/js/*.js')
  return gulp.src(glob)
    .pipe(order([
      '*jquery.min.js*', // If jQuery is included, move to the top
      '*popper.min.js*', // Then Popper
      '*bootstrap.min.js*', // Then Bootstrap
      // '*flexibility.js*',
      // '*responsive-nav.min.js*',
      '*jquery.scrollex.min.js*',
      '*jquery.scrolly.min.js*',
      '*breakpoints.min.js*',
      '*browser.min.js*',
      '*util.js*', // Util MUST be before main!
      '*main.js*']))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('src/js'))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('src/js'))
  // .pipe(browserSync.reload({stream:true}));
    .pipe(browserSync.stream())
});

// run 'compile-sass' when server runs
gulp.task('launch-server', function() {
  // run server
  browserSync.init({
    server: './src'
  })
  gulp.watch(['src/assets/sass/*.scss', 'src/assets/sass/libs/*.scss'], gulp.series('compile-sass')).on('change', browserSync.reload)
  gulp.watch('src/assets/js/*.js', gulp.series('concat-js')).on('change', browserSync.reload)
  // watch for html changes
  gulp.watch('src/*.html').on('change', browserSync.reload)
});

// run gulp, execute js task, launch server and browser
gulp.task('default',
  gulp.series('clean', 'move-stuff', 'concat-js', 'compile-sass', 'launch-server')
);
