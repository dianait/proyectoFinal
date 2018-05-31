/*==================================================================================================
==================================================================================================*/
var user = {};
var email, nombre, apellido, password, rol, guardar;
var urlBase = "http://localhost:4000";
var emailConsulta = getCookie("email");
var passwordConsulta = getCookie("password");
document.getElementById("userName").innerText = emailConsulta.toUpperCase();

 (function(){
    if (!document.cookie){
        location.href = "/";
    }
    recogerFormulario();

    //Hacemos la peticion
  fetch(urlBase + "/login?email=" + emailConsulta + "&password=" + passwordConsulta)
  .then(function(respuesta) {
    return respuesta.json();
  })
  .then(function(user) {
        rellenarFormulario(user);
  });

 })();


 function rellenarFormulario(user){
    //Rellenamos los datos obtenidos de la consulta a la base de datos en el formulario de perfil
    email.value = user.EMAIL;
    nombre.value = user.NOMBRE;
    apellido.value = user.APELLIDO;
    rol.value = user.ROL;
    id = user.ID;
    activo = user.ACTIVO;
 }

 function recogerFormulario(){

    //Guradamos las referencias a los input del formulario para después rellenarlos con la consulta a la base de datos
    email = document.getElementById('emailUser');
    password = document.getElementById('passwordUser');
    nombre = document.getElementById('nombreUser');
    apellido = document.getElementById('apellidoUser');
    rol = document.getElementById('rolUser');
    guardar = document.getElementById('guardarBoton');

}

function preGuardarPerfil(){
    console.log("Preguardarperfil funcionando")
    password = document.getElementById('passwordUser').value;
    var password2 = document.getElementById('passwordUser2').value;

    console.log(password);
    console.log(password2);

    if(password != password2){
        var modal = document.getElementsByClassName("modal");
        console.log("ELEMENTO HTML ABAJO");
        console.log(modal);
        modal.style.display = "none";
        var mensaje = document.getElementById("mensajeRespuesta") ;
        mensaje.innerHTML = `<div class="alert alert-danger" role="alert">
        <strong>Oh vaya!</strong> Las contraseñas no coinciden. 
        </div>`
        setTimeout(function () {
            mensaje.style.display = "none";
        }, 5000);
    }
}

//Función modificar en la base de datos, dependiendo de las cosas que hy que guardar
function guardarPerfil(){
    email = document.getElementById('emailUser').value;
    password = document.getElementById('passwordUser').value;
    var password2 = document.getElementById('passwordUser2').value;
    nombre = document.getElementById('nombreUser').value;
    apellido = document.getElementById('apellidoUser').value;
    rol = document.getElementById('rolUser').value;

    if (activo == 0){
        activo = 1;
    }
            console.log("_____________________________") 
            console.log(" SE VA A PROCEDER A CAMBIAR LOS DATOS ")
            console.log("_____________________________")


    //parámetros para la petición a la api con los datos recogidos del formulario
    var trozoUrl = `?email=${email}&nombre=${nombre}&apellido=${apellido}&rol=${rol}&activo=${activo}&id=${id}`;
    usuarioEditar(trozoUrl, function (res){
    console.log(res);
    })

    changePassword(email, password);

     //Recogemos el elemento HTML dónde mostraremos el mensaje resultante de guardar los cambios 
     var msgRES = document.getElementById("mensajeRespuesta");
     mensajeRespuesta(msgRES, "OK");
}


function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/*-----------------------------------------------------------------------------
Función que muestra un mensaje con el resulta de una acción en en concreto
-------------------------------------------------------------------------------

elemento: ELEMENTO HTML (un div por ejemplo) dónde colocar el mensaje
mensaje: String ==> OK (Mensaje en verde) o KO (Mensaje en rojo)
f()
-->
------------------------------------------------------------------------------*/

function mensajeRespuesta(elemento, mensaje){
    var texto; 
    if (mensaje == "OK") {
        texto = `<div class="alert alert-success" role="alert">
        <strong>¡Perfecto!</strong> Tus datos han sido  actualizados correctamente.
        </div>`;
        elemento.innerHTML = texto;
	    elemento.style.display = "block";
	    setTimeout(function () {
		elemento.style.display = "none";
	}, 3000);
        return
    }

        texto = `<div class="alert alert-danger" role="alert">
        <strong>Oh vaya!</strong> Parece que algo ha ido mal. Inténtalo un poco más tarde. 
        </div>`;
        
    elemento.innerHTML = texto;
	elemento.style.display = "block";
	setTimeout(function () {
		elemento.style.display = "none";
	}, 10000);
}