/* eslint-disable */

// npm install gulp gulp-plumber gulp-csso gulp-imagemin gulp-webp gulp-svg-sprite node-sass gulp-sass gulp-postcss autoprefixer gulp-pretty-html gulp-babel babel-loader @babel/core @babel/preset-env babel-plugin-transform-runtime gulp-file-include gulp-rename del gulp-cache browser-sync webpack webpack-stream bem-tools-core bem-tools-create --save-dev

const 
  gulp = require('gulp'),
  {src, dest} = require('gulp'),
  plumber = require('gulp-plumber'),
  csso = require('gulp-csso'),
  imagemin = require('gulp-imagemin'),
  webp = require('gulp-webp'),
  svgSprite = require('gulp-svg-sprite'),
  sass = require('gulp-sass'),
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  prettyHtml = require('gulp-pretty-html'),
  babel = require('gulp-babel'),
  include = require('gulp-file-include'),
  rename = require('gulp-rename'),
  del = require('del'),
  cache = require('gulp-cache'),
  browserSync = require('browser-sync').create(),
  webpackStream = require('webpack-stream');

function style() {
  return src('src/styles/style.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(dest('dist/css'))
    .pipe(csso())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(dest('dist/css'))
    .pipe(browserSync.stream());
}

function html() {
  return src(['src/blocks/modules/pages/*/*.html'])
  .pipe(include({
    prefix: '@@',
    basepath: '@file'
  }))
  .pipe(prettyHtml({
    indent_size: 2
  }))
  .pipe(rename({
    dirname: "/",
  }))
  .pipe(dest('dist'))
  .pipe(browserSync.stream());
}

function phpViews() {
  return src(['src/views/*.php', 'src/views/pages/*.php'])
  .pipe(dest('dist'))
  .pipe(browserSync.stream());
}

function script() {
  return src('src/js/*.js')
    .pipe(plumber())
    .pipe(webpackStream({
      output: {
        filename: 'script.min.js',
      },
      module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              },
              plugins: [
                ['transform-runtime', {
                  'regenerator': true
                }]
              ]
            }
          }
        ]
      }
    }))
    .pipe(dest('dist/js'))
    .pipe(browserSync.stream());
}

function images() {
  return src(
    [
    'src/img/*.{jpg,jpeg,png,gif,svg}',
    '!src/img/favicon/*',
    'src/blocks/modules/common/*/img/*.{jpg,jpeg,png,gif,svg}',
    'src/blocks/modules/pages/*/*/img/*.{jpg,jpeg,png,gif,svg}'
    ])
  .pipe(imagemin([
    imagemin.optipng(),
    imagemin.mozjpeg({
      quality: 85, 
      progressive: true
    }),
    imagemin.gifsicle({interlaced: true}),
    imagemin.svgo({
      plugins: [
        {removeViewBox: true},
        {cleanupIDs: false}
      ]
    })
  ]))
  .pipe(rename({
    dirname: "/",
  }))
  .pipe(dest('dist/img'));
}

function webP() {
  return src([
    'src/img/*.{png,jpg,jpeg}',
    '!src/img/favicon/*',
    'src/blocks/modules/*/img/*.{jpg,jpeg,png}'
  ])
  .pipe(webp())
  .pipe(rename({
    dirname: "/",
  }))
  .pipe(dest('dist/img'));
}

function spriteSvg() {
  return src('src/img/svg/*.svg')
  .pipe(imagemin([
    imagemin.svgo({
      plugins: [
        {removeViewBox: true},
        {cleanupIDs: false},
        { removeAttrs: { attrs: '(fill|stroke)' } }
      ]
    })
  ]))
  .pipe(svgSprite({
    mode: {
      stack: {
        sprite: "../sprite.svg"
      }
    },
  }))
  .pipe(dest('dist/img'));
}

function fonts() {
  return src('src/fonts/**/*.{woff,woff2}')
  .pipe(dest('dist/fonts'));
}

function favicon() {
  return src('src/img/favicon/*')
  .pipe(dest('dist/img/favicon'));
}

function gzip() {
  return src('src/.htaccess')
  .pipe(dest('dist/'));
}

function server() {
  return browserSync.init({
    server: 'dist/',
    port: 3000,
    notify: true
  });
}

function watch() {
  gulp.watch(['src/blocks/modules/common/**/*/*.html', 'src/blocks/modules/pages/**/*.html'], gulp.parallel(html));
  gulp.watch(['src/blocks/modules/**/*/*.scss', 'src/styles/**/*.scss'], gulp.parallel(style));
  gulp.watch(['src/blocks/**/*.js', 'src/js/**/*.js'], gulp.parallel(script));
  gulp.watch(['src/blocks/**/*.php', 'src/views/**/*.php'], gulp.parallel(phpViews));
  gulp.watch('src/img/svg/*.svg', gulp.parallel(spriteSvg));
  gulp.watch(['src/img/**/*.{jpg,jpeg,png,gif,svg}', 'src/blocks/modules/common/*/*.{jpg,jpeg,png,gif,svg}', 'src/blocks/modules/pages/**/*.{jpg,jpeg,png,gif,svg}'], gulp.parallel(images));
  gulp.watch('src/img/**/*.{png,jpg,jpeg}', gulp.parallel(webP));
  gulp.watch('src/fonts/**/*.{woff,woff2}', gulp.parallel(fonts));
}

function clean() {
  return del('dist');
}

function clear() {
  return cache.clearAll();
}

exports.build = gulp.series(clean, clear,
    gulp.parallel([html, style, script, images, webP, spriteSvg, fonts, favicon, gzip]),
    gulp.parallel(server, watch));