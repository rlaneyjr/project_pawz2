var gulp = require('gulp')
var browserSync = require('browser-sync').create() 
var sass = require('gulp-sass')

// move the vendor scss into our project
gulp.task('move-bootstrap-sass', function(){
  return gulp.src('node_modules/bootstrap/dist/scss/*')
    .pipe(gulp.dest('src/assets/sass/libs/bootstrap'))
    .pipe(browserSync.stream()) 
})

gulp.task('move-responsive-sass', function(){
  return gulp.src('node_modules/responsive-tools/dist/*.scss')
    .pipe(gulp.dest('src/assets/sass/libs'))
    .pipe(browserSync.stream()) 
})

gulp.task('move-sass',
  gulp.parallel('move-bootstrap-sass', 'move-responsive-sass')
)

// compile sass same as running this from commandline:
// sass 'node_modules/bootstrap/scss/bootstrap.scss src/scss/*.scss' src/css
gulp.task('compile-sass', function(){
  return gulp.src(['node_modules/bootstrap/scss/bootstrap.scss', 
    'src/assets/sass/*.scss']) 
    .pipe(sass())
    .pipe(gulp.dest('src/assets/css')) 
    .pipe(browserSync.stream())
})

// move the minimized versions of vendor javascript into our project
gulp.task('move-js', function(){
  return gulp.src(['node_modules/bootstrap/dist/js/bootstrap.min.js',
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/popper.js/dist/umd/popper.min.js'])
    .pipe(gulp.dest('src/assets/js'))
    .pipe(browserSync.stream()) 
})

// run 'compile-sass' when server runs
gulp.task('launch-server', ['compile-sass'], function(){
  // run server
  browserSync.init({
    server: './src'
  })
  // watch for any changes in src/scss folder and run task 'compile-sass'
  gulp.watch(['src/assets/scss/**/*.scss', 'src/assets/scss/*.scss'],
    ['compile-sass'])
  // watch for html changes
  gulp.watch('src/*.html').on('change', browserSync.reload)
})

// run gulp, execute js task, launch server and browser
gulp.task('default', ['move-js','launch-server'])
