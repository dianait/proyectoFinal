/*==================================================================================================
==================================================================================================*/
var user = {};
var urlBase = "http://localhost:4000";
var emailConsulta = getCookie("email");


document.getElementById("userName").innerText = emailConsulta.toUpperCase();

console.log(emailConsulta);

var passwordConsulta = getCookie("password");
console.log(passwordConsulta);
var email, nombre, apellido, password, rol, guardar;


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
      console.log(user); 
        rellenarFormulario(user);
  });

 })();


 function rellenarFormulario(user){
    //Rellenamos los datos obtenidos de la consulta a la base de datos en el formulario de perfil
    email.value = user.EMAIL;
    nombre.value = user.NOMBRE;
    password.value = user.PASSWORD;
    apellido.value = user.APELLIDO;
    rol.value = user.ROL;
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