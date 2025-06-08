const URL_MENSAJES = `http://localhost:3000/api`;
const URL_SUBSCRIBE = `${URL_MENSAJES}/subscribe`
const URL_GET_KEY = `${URL_MENSAJES}/key`


var url = window.location.href;
var swLocation = '/twittor/sw.js';
let swReg;

if (navigator.serviceWorker) {


    if (url.includes('localhost')) {
        swLocation = '/sw.js';
    }

    window.addEventListener("load", () => {

    })
    navigator.serviceWorker.register(swLocation).then(registro => {
        swReg = registro;
        swReg.pushManager.getSubscription().then(verificaSuscripcion)
    });
}





// Referencias de jQuery

var titulo = $('#titulo');
var nuevoBtn = $('#nuevo-btn');
var salirBtn = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn = $('#post-btn');
var avatarSel = $('#seleccion');
var timeline = $('#timeline');

var modal = $('#modal');
var modalAvatar = $('#modal-avatar');
var avatarBtns = $('.seleccion-avatar');
var txtMensaje = $('#txtMensaje');

var btnActivadas = $('.btn-noti-activadas')
var btnDesactivadas = $('.btn-noti-desactivadas')

// El usuario, contiene el ID del hÃ©roe seleccionado
var usuario;




// ===== Codigo de la aplicaciÃ³n

function crearMensajeHTML(mensaje, personaje) {

    var content = `
            <img src="img/avatars/${personaje}.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${personaje}</h3>
                <br/>
                ${mensaje}
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

    timeline.prepend(content);
    cancelarBtn.click();

}



// Globals
function logIn(ingreso) {

    if (ingreso) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');

        titulo.text('Seleccione Personaje');

    }

}


// Seleccion de personaje
avatarBtns.on('click', function () {

    usuario = $(this).data('user');

    titulo.text('@' + usuario);

    logIn(true);

});

// Boton de salir
salirBtn.on('click', function () {

    logIn(false);

});

// Boton de nuevo mensaje
nuevoBtn.on('click', function () {

    modal.removeClass('oculto');
    modal.animate({
        marginTop: '-=1000px',
        opacity: 1
    }, 200);

});

// Boton de cancelar mensaje
cancelarBtn.on('click', function () {
    if (!modal.hasClass('oculto')) {
        modal.animate({
            marginTop: '+=1000px',
            opacity: 0
        }, 200, function () {
            modal.addClass('oculto');
            txtMensaje.val('');
        });
    }
});

// Boton de enviar mensaje
postBtn.on('click', function () {

    var mensaje = txtMensaje.val();
    if (mensaje.length === 0) {
        cancelarBtn.click();
        return;
    }
    sendMensaje(mensaje, usuario);
    crearMensajeHTML(mensaje, usuario);

});

// Otener mensajes del servidor

// Otener mensajes del servidor
function getMensajes() {
    fetch(URL_MENSAJES)
        .then(resp => resp.json())
        .then(mensajes => {
            Array.from(mensajes).forEach(element => {
                crearMensajeHTML(element.mensaje, element.user);
            });
        })
}

function sendMensaje(mensaje, user) {
    fetch(URL_MENSAJES, {
        method: "POST",
        body: JSON.stringify({ mensaje, user }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(resp => resp.json())
        .then(res => console.log('app.js', res))
        .catch(err => console.log('app.js error:', err))

}

getMensajes();

//detectar cambios conexion 

function isOnline() {

    if (navigator.onLine) {
        console.log("Online");
        mdtoast("Mensaje toast", {
            interaction: true,
            interactionTime: 1000,
            actionText: "OK!!",
            type: "success",

        })

    } else {
        console.log("Offline");
        mdtoast("Mensaje toast", {
            interaction: true,
            interactionTime: 1000,
            actionText: "OH,OH!",
            type: "error",

        })
    }
}
window.addEventListener('online', isOnline);
window.addEventListener('offline', isOnline);

function verificaSuscripcion(activadas) {

    console.log(activadas);

    if (activadas) {

        btnActivadas.removeClass('oculto')
        btnDesactivadas.addClass('oculto')

    } else {

        btnDesactivadas.removeClass('oculto')
        btnActivadas.addClass('oculto')

    }
}


function enviarNotificacion() {

    const notificationOpts = {
        body: 'Este es el cuerpo de la notificacion',
        icon: 'img/icons/icon-72x72.png'
    }

    new Notification('Hola mundo', notificationOpts)
}

//NOtificaciones
function notificarme() {

    if (!window.Notification) {
        console.log("Este navegador no soporta notificaciones");
        return;
    }

    if (Notification.permission === "granted") {

        enviarNotificacion();

    } else if (Notification.permission !== "denied" || Notification.permission == "default") {
        Notification.requestPermission(function (permission) {

            console.log(permission);


            if (permission == "granted") {
                enviarNotificacion();
            }
        });
    }

}
//notificarme();
//verificaSuscripcion()

//getKey

function getPublicKey() {

    return fetch(`${URL_GET_KEY}`)
        .then(resp => resp.arrayBuffer())
        .then(key => new Uint8Array(key))
}

//getPublicKey().then(console.log)

btnDesactivadas.on('click', function () {
    if (!swReg) return console.log("NO existe ningun service worker registrado");
    getPublicKey().then((key) => {

        swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        }).then(res => res.toJSON())
            .then((suscripcion) => {


                console.log(suscripcion);
                return fetch(`${URL_SUBSCRIBE}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(suscripcion)
                }).then(verificaSuscripcion)
                    .catch(console.log())
                //verificaSuscripcion(suscripcion)

            })
    })
})

function cancelarSubscripcion() {

    swReg.pushManager.getSubscription().then(subs => {

        subs.unsubscribe().then(() => {


            verificaSuscripcion(false)
        })
    })
}

btnActivadas.on('click', function () {

    cancelarSubscripcion();

})