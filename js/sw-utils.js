
//guardar en el cache dinamico
function actualizaCacheDinamico(dynamic, req, res) {

    if (res.ok) {
        return caches.open(dynamic).then(cache => {
            cache.put(req, res.clone())
            return res.clone()
        })
    } else {
        return res;
    }
}