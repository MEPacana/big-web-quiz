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

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => {
                    return name !== cacheName;
                }).map((name) => {
                    return caches.delete(name);
                })
            )
        })
    );
})

self.addEventListener('push', (event) => {
    const notification = event.data ? event.data.json() : {
        title: 'New Question Available',
        body: 'Click to view new question.'
    };
    event.waitUntil(
        self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon,
            tag: 'big-web-quiz'
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.waitUntil(
        self.registration.getNotifications({ tag: 'big-web-quiz' })
            .then((notifications) => {
                notifications.forEach((notification) => notification.close());
            })
            .then(() => {
                const options = { includeUncontrolled: true };
                return self.clients.matchAll(options).then((clients) => {
                    const client = clients.find((client) =>
                        (new URL(client.url)).pathname === '/');
                    if (client) {
                        client.focus();
                    } else {
                        self.clients.openWindow('/');
                    }
                });
            })
    );
});
