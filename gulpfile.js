////////////////////////////////
// Setup
////////////////////////////////

// Gulp and package
const { src, dest, parallel, series, watch } = require('gulp')
const pjson = require('./package.json')

// Plugins
const autoprefixer = require('autoprefixer')
const browserSync = require('browser-sync').create()
const concat = require('gulp-concat')
const cssnano = require ('cssnano')
const imagemin = require('gulp-imagemin')
const pixrem = require('pixrem')
const plumber = require('gulp-plumber')
const postcss = require('gulp-postcss')
const reload = browserSync.reload
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const spawn = require('child_process').spawn
const uglify = require('gulp-uglify-es').default
const  del = require('del')

// Relative paths function
function pathsConfig(appName) {
  this.app = `./${pjson.name}`
  const vendorsRoot = 'node_modules'
  const pawzAssets = `${this.app}/static/assets`
  return {
    app: this.app,
    bootstrapSass: `${vendorsRoot}/bootstrap/scss`,
    fontawesomeSass: `${vendorsRoot}/font-awesome/scss`,
    fontawesomeFonts: `${vendorsRoot}/font-awesome/fonts`,
    responsiveSass: `${vendorsRoot}/responsive-tools/src`,
    vendorsJs: [
      `${vendorsRoot}/jquery/dist/jquery.slim.js`,
      `${vendorsRoot}/popper.js/dist/umd/popper.js`,
      `${vendorsRoot}/bootstrap/dist/js/bootstrap.js`,
      `${vendorsRoot}/jquery.scrollex/jquery.scrollex.js`,
      // `${vendorsRoot}/scrolly/src/js/scrolly.js`,
      `${pawzAssets}/js/old/jquery.scrolly.js`,
      `${vendorsRoot}/responsive-tools/src/breakpoints.js`,
      `${vendorsRoot}/responsive-tools/src/browser.js`,
      // `${pawzAssets}/js/libs/breakpoints.min.js`,
      // `${pawzAssets}/js/libs/browser.min.js`,
      // `${pawzAssets}/js/libs/jquery.min.js`,
      // `${pawzAssets}/js/libs/jquery.scrollex.min.js`,
      // `${pawzAssets}/js/libs/jquery.scrolly.min.js`,
    ],
    assetsScss: `${pawzAssets}/sass`,
    assetsScssLibs: `${pawzAssets}/sass/libs`,
    assetsJs: `${pawzAssets}/js`,
    assetsJsLibs: `${pawzAssets}/js/libs`,
    css: `${this.app}/static/css`,
    sass: `${this.app}/static/sass`,
    sassLibs: `${this.app}/static/sass/libs`,
    fonts: `${this.app}/static/fonts`,
    images: `${this.app}/static/images`,
    js: `${this.app}/static/js`,
    jsLibs: `${this.app}/static/js/libs`,
    templates: `${this.app}/templates`,
  }
}
var paths = pathsConfig()

////////////////////////////////
// Tasks
////////////////////////////////

function clean(done) {
  return del([
    `${paths.js}/**`,
    `${paths.css}/**`,
  ])
}

// move the vendor stuff into our project
function moveBootstrapSass() {
  return src(`${paths.bootstrapSass}/**`)
    .pipe(dest(`${paths.sass}/libs/bootstrap`))
}

function moveResponsiveSass() {
  return src(`${paths.responsiveSass}/*.scss`)
    .pipe(dest(`${paths.sass}/libs`))
}

function moveFaSass() {
  return src(`${paths.fontawesomeSass}/*`)
    .pipe(dest(`${paths.sass}/libs/font-awesome`))
}

function moveFaFonts() {
  return src(`${paths.fontawesomeFonts}/*`)
    .pipe(dest(`${paths.fonts}`))
}

function moveFaFontsAssets() {
  return src(`${paths.fontawesomeFonts}/*`)
    .pipe(dest(`${paths.sass}/libs/fonts`))
}

function moveJs() {
  return src(`${paths.assetsJs}/*.js`)
    .pipe(dest(`${paths.js}`))
}

function moveSass() {
  return src(`${paths.assetsScss}/*.scss`)
    .pipe(dest(`${paths.sass}`))
}

function moveSassLibs() {
  return src(`${paths.assetsScssLibs}/*.scss`)
    .pipe(dest(`${paths.sassLibs}`))
}

// Styles autoprefixing and minification
function styles() {
  var processCss = [
      autoprefixer(), // adds vendor prefixes
      // autoprefixer({browsers: ['last 2 versions']}), // adds vendor prefixes
      pixrem(),       // add fallbacks for rem units
  ]
  var minifyCss = [
      cssnano({ preset: 'default' })   // minify result
  ]
  return src(`${paths.sass}/main.scss`)
    .pipe(sass({
      includePaths: [
        paths.sassLibs
      ]
    }).on('error', sass.logError))
    .pipe(plumber()) // Checks for errors
    .pipe(postcss(processCss))
    .pipe(dest(paths.css))
    .pipe(rename({ suffix: '.min' }))
    .pipe(postcss(minifyCss)) // Minifies the result
    .pipe(dest(paths.css))
}

// Javascript minification
function scripts() {
  return src([paths.assetsJs])
    .pipe(concat('project.js'))
    .pipe(dest(paths.js))
    .pipe(plumber()) // Checks for errors
    .pipe(uglify()) // Minifies the js
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(paths.js))
}

// Vendor Javascript minification
function vendorScripts() {
  return src(paths.vendorsJs)
    .pipe(concat('vendors.js'))
    .pipe(dest(paths.js))
    .pipe(plumber()) // Checks for errors
    .pipe(uglify()) // Minifies the js
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(paths.js))
}

// move the minimized versions of vendor css into our project
function vendorCss() {
  return src(`${paths.vendorsCss}`)
    .pipe(autoprefixer({browsers: ['last 2 versions']})) // Adds vendor prefixes
    .pipe(pixrem())  // add fallbacks for rem units
    .pipe(rename({ suffix: '.min' }))
    .pipe(cssnano()) // Minifies the result
    .pipe(dest(paths.css))
}

// Image compression
function imgCompression() {
  return src(`${paths.images}/**`)
    .pipe(imagemin()) // Compresses PNG, JPEG, GIF and SVG images
    .pipe(dest(paths.images))
}

// Run django server
function runServer(cb) {
  var cmd = spawn('python', ['manage.py', 'runserver'], {stdio: 'inherit'})
  cmd.on('close', function(code) {
    console.log('runServer exited with code ' + code)
    cb(code)
  })
}

// Browser sync server for live reload
function initBrowserSync() {
    browserSync.init(
      [
        `${paths.css}/*.css`,
        `${paths.js}/*.js`,
        `${paths.templates}/*.html`
      ], {
        proxy: 'localhost:8000'
        // // https://www.browsersync.io/docs/options/#option-proxy
        // proxy:  {
        //   target: 'django:8000',
        //   proxyReq: [
        //     function(proxyReq, req) {
        //       // Assign proxy "host" header same as current request at Browsersync server
        //       proxyReq.setHeader('Host', req.headers.host)
        //     }
        //   ]
        // },
        // // https://www.browsersync.io/docs/options/#option-open
        // // Disable as it doesn't work from inside a container
        // open: false
      }
    )
}

// Watch
function watchPaths() {
  watch(`${paths.sass}/*.scss`, styles).on("change", reload)
  watch(`${paths.templates}/**/*.html`).on("change", reload)
  watch([`${paths.js}/*.js`, `!${paths.js}/*.min.js`], scripts).on("change", reload)
}

const moveStuff = series(moveJs, moveSass, moveSassLibs,
  parallel(
    moveBootstrapSass,
    moveResponsiveSass,
    moveFaSass,
    moveFaFonts,
    moveFaFontsAssets
  )
)

// Generate all assets
const generateAssets = parallel(
  styles,
  scripts,
  vendorScripts,
  imgCompression
)

// Set up dev environment
const dev = parallel(
  runServer,
  initBrowserSync,
  watchPaths
)

exports.default = series(moveStuff, generateAssets, dev)
exports["generate-assets"] = generateAssets
exports["dev"] = dev
