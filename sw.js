//imports
importScripts('js/sw-utils.js')

const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const INMUTABLE_CACHE = 'inmutable-v1';

const APP_SHELL = [
    '/',
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/spiderman.jpg',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'js/app.js',
    'js/sw-utils.js'
];
const APP_SHEL_INMUTABLE = [   
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
    'js/libs/jquery.js',
];

self.addEventListener("install", (e) => {

    const cacheStatic = caches.open(STATIC_CACHE)
        .then(cache => cache.addAll(APP_SHELL));
    const cacheInmutable = caches.open(INMUTABLE_CACHE)
        .then(cache => cache.addAll(APP_SHEL_INMUTABLE));
    e.waitUntil(Promise.all([cacheStatic, cacheInmutable]));
})

self.addEventListener("activate", (e) => {

    const respuesta = caches.keys().then(keys => {
        keys.forEach(key => {
            if (key != STATIC_CACHE && key.includes('static')) {
                return caches.delete(key);
            }
             if (key != DYNAMIC_CACHE && key.includes('dynamic')) {
                return caches.delete(key);
            }
        })
    })
    e.waitUntil(respuesta);

})

self.addEventListener("fetch", e => {

    const respuesta = caches.match(e.request).then(res => {
        if (res) return res;
        if(e.request.url.includes("chrome-extension")) return fetch(e.request)
            return fetch(e.request).then(newRes => {
                actualizaCacheDinamico(DYNAMIC_CACHE, e.request, newRes);
            })
        
    })
    e.respondWith(respuesta)
})