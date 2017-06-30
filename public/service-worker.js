const cacheName = 'cache1';
const urlsToCache = [
    '/',
    'static/stylesheets/main.css',
    '__/firebase/4.1.3/firebase-app.js',
    '__/firebase/4.1.3/firebase-auth.js',
    '__/firebase/4.1.3/firebase-database.js',
    '__/firebase/4.1.3/firebase-messaging.js',
    '__/firebase/init.js',
    'static/javascripts/router.js',
    'static/javascripts/main.js',
    'static/images/btn-google-signin.png',
    'static/fonts/Sequel-Regular.ttf',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.open(cacheName).then((cache) => {
            return cache.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        })
    )
});
