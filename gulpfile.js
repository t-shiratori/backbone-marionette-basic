var gulp = require('gulp'),
    browserSync = require('browser-sync');

var src_url_watch_html = '*.html',
    src_url_watch_js = 'js/**/*.js';


// browser-sync
gulp.task('browser-sync', function () {
  browserSync({
    port: 9999,
    server: {
      baseDir: './'  //対象ディレクトリ
    }
  });
});

// browser-sync reload
gulp.task('browser-sync-reload', function () {
  browserSync.reload();
});

// watch
gulp.task('watch', function () {
  gulp.watch([src_url_watch_js], ['browser-sync-reload']);
  gulp.watch([src_url_watch_html], ['browser-sync-reload']);
});

gulp.task('default',['watch','browser-sync']);
