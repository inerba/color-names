//console.log('sw start');
self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open('v1').then(function(cache) {
        return cache.addAll([
          './',
          './assets/css/style.min.css',
          './app/js/dist/bundle.js',
        ]);
      })
    );
  });