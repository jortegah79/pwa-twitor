importScripts("https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js");
importScripts('js/sw-db.js');
importScripts('js/sw-utils.js');

const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const INMUTABLE_CACHE = 'inmutable-v1';


const APP_SHELL = [
    '/',
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'js/app.js',
    'js/sw-utils.js',
    'js/sw-db.js',
    'js/libs/plugins/mdtoast.min.css',
    'js/libs/plugins/mdtoast.min.js'
];

const APP_SHELL_INMUTABLE = [
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js',

];



self.addEventListener('install', e => {


    const cacheInmutable = caches.open(INMUTABLE_CACHE).then(cache =>
        cache.addAll(APP_SHELL_INMUTABLE));

    const cacheStatic = caches.open(STATIC_CACHE).then(cache =>
        cache.addAll(APP_SHELL));



    e.waitUntil(Promise.all([cacheStatic, cacheInmutable]));

});


self.addEventListener('activate', e => {

    const respuesta = caches.keys().then(keys => {

        keys.forEach(key => {

            if (key !== STATIC_CACHE && key.includes('static')) {
                return caches.delete(key);
            }

            if (key !== DYNAMIC_CACHE && key.includes('dynamic')) {
                return caches.delete(key);
            }

        });

    });

    e.waitUntil(respuesta);

});


self.addEventListener('fetch', e => {


    let respuesta;

    if (e.request.url.includes('/api')) {

        respuesta = manejoApiMensajes(DYNAMIC_CACHE, e.request);

    } else {
        if (e.request.url.includes(".ttf") || e.request.url.includes(".woff") || e.request.url.includes(".woff2")) {
            return fetch(e.request);
        }
        if (e.request.url.includes("chrome-extension")) return fetch(e.request)

        respuesta = caches.match(e.request).then(res => {

            if (res) {

                actualizaCacheStatico(STATIC_CACHE, e.request, APP_SHELL_INMUTABLE);
                return res.clone();
            } else {

                return fetch(e.request).then(newRes => {

                    return actualizaCacheDinamico(DYNAMIC_CACHE, e.request, newRes);

                });

            }

        });
    }
    e.respondWith(respuesta);

});


self.addEventListener("push", (e) => {


    const notification = JSON.parse(e.data.text());

    const options = {
        body: notification.cuerpo,
        icon: `img/avatars/${notification.usuario}.jpg`,
        badge: 'img/favicon.ico',
        image: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/a/a9/Torre_de_Los_Vengadores_AoU.png/revision/latest?cb=20201216023635&path-prefix=es',
        data: {
            url: 'http://localhost:3000'
        }
    };

    e.waitUntil(self.registration.showNotification(notification.titulo, options))


})

self.addEventListener("notificationclose", e => {

    console.log('Notificacion cerrada', e);
})

self.addEventListener("notificationclick", e => {

    const notification = e.notification;
   
    console.log(notification);

    const respuesta = clients.matchAll()
        .then(clientes => {
            let cliente = clientes.find(c => c.visibilityState === 'visible')
            if (cliente != undefined) {
                cliente.navigate(notification.data.url)
                cliente.focus();
            } else {
                openTab(notification.data.url)
            }
            
            return notification.close();
            
        })
        e.waitUntil(respuesta )
})