/*==================================================================================================
==================================================================================================*/
var usersList = [];
 //Array para guardar los usuarios

 /* REFERENCIAS DOM */

 if (!document.cookie){
    location.href = "/";
}
var mensajeRespuesta = document.getElementById("msg");
//Dónde se va a visualizar el mensaje de exito o error

 var tabla = document.getElementById("tablaUsers"); 
 // Hace referencia a la etiqueta <tbody> de la tabla de usuarios
 
 (function(){

    //Utilizamos método usersGet de api.js y dentro ejecutamos un método para mostrar los datos de usuarios.js    
    usersGet(function(users){
        RellenarTablaUsuarios(tabla, users); 
        //Le pasamos donde queremos poner los datos (tabla) y los datos 
    }); 

 })();
 /*==================================================================================================
============================= CARGAR DATOS USUARIOS ==============================================*/
/*==================================================================================================
==================================================================================================*/

function RellenarTablaUsuarios(tabla, users){
    
    users.forEach(user => {
    tablaUsers.innerHTML += `  <tr>
        <td>

        </td>
        <td>`+ user.ID + `</td>
        <td>`+ user.NOMBRE + " " + user.APELLIDO + `</td>
        <td>`+ user.EMAIL +`</td>
        <td>`+ user.ROL +`</td>
        <td>`+ user.ACTIVO +`</td>
        <td>
        <a href="#editEmployeeModal" class="edit" name="`+ user.ID +`" onclick="mostrarModal(this)" data-toggle="modal"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>
        <a id="botonEliminarUser" href="#" name="`+ user.ID +`" onclick="mostrarModal(this)" class="delete"><i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i></a>
        </td>
        </tr>`;

        usersList[user.ID] = user;

        

    });


};
/*==================================================================================================
================================= MOSTRAR MODAL EDITAR/BORRAR =====================================*/
/*==================================================================================================
==================================================================================================*/

function mostrarModal(elemento){
    
    var id = (elemento.getAttribute("name")); 
    //recogemos el atributo name del boton que tiene como valor el id del usuario, esto lo hemos hecho al crear la tabla, 
    //para poder recuperar facilmente el id sin realizar otra consulta extra a la BBDD
    var op = elemento.getAttribute("class");
    //recogemos el atributo class que nos dira si la acción es editar (edit) o borrar (delete)

    var boton = document.getElementById("boton" +  op);
    boton.setAttribute("name", id);
    boton.setAttribute("alt", op);
    //Añadimos el mismo atributo al botón ELIMINAR para poder ejecutar la funcion borrarUser(id) pasándole el id

    elemento.setAttribute("href", "#" +  op + "EmployeeModal");
    elemento.setAttribute("data-toggle","modal");
    //Añadimos al modal los atributos que hacen que se desplegue cuando pulsamos sobre el icono de EDITAR o de ELIMINAR en la tabla de usuarios
    rellenarEditarUser(id);
}
/*==================================================================================================
=================================== BORRAR USUARIO ===============================================*/
/*==================================================================================================
==================================================================================================*/

function borrarUser(elemento){

    var id = elemento.getAttribute("name");
   //recogemos el atributo name del boton que tiene como valor el id del usuario, esto lo hemos hecho al crear la tabla, 
   //para poder recuperar facilmente el id sin realizar otra consulta extra a la BBDD

   userDelete(id, function (error, data){
       mostrarResultado(error, data);
    });
    
   var cerrar = document.getElementById("cerrarModal");
   cerrar.click(); 
};
/*==================================================================================================
================================== AÑADIR USUARIO ================================================*/
/*==================================================================================================
==================================================================================================*/

function addUsuario(elemento){
    var id = (elemento.getAttribute("name")); 

    //RECOGEMOS LOS VALORES DEL FORMULARIO
    var nombre = document.getElementById("nombreUser").value;
    var apellido = document.getElementById("apellidoUser").value;
    var email = document.getElementById("emailUser").value;
    var rol = document.getElementById("rolUser").value;

    //parámetros para la petición a la api con los datos recogidos del formulario
    var url = `?nombre= ` + nombre + `&apellido=` + apellido + `&email=` + email + `&rol=` + rol;
    
    userAdd(url, function(error, data){
        mostrarResultado(error, data);

    });

    //recogemos la referencia al boton x para cerrar el modal, y lo pulsamos desde javascirpt. Si no, no se cierra el modal al pulsar a "Añandir"
    var cerrar = document.getElementById("modalAddUser");
    cerrar.click();



};
/*==================================================================================================
======================================== EDITAR USUARIO ===========================================*/
/*==================================================================================================
==================================================================================================*/

function editarUsuario(elemento){

    var id = elemento.getAttribute("name"); 

    //RECOGEMOS LOS VALORES DEL FORMULARIO
    var nombre = document.getElementById("nombreUserEDIT").value;
    var apellido = document.getElementById("apellidoUserEDIT").value;
    var email = document.getElementById("emailUserEDIT").value;
    var password = document.getElementById("passwordUserEDIT").value;
    var rol = document.getElementById("rolUserEDIT").value;

    //parámetros para la petición a la api con los datos recogidos del formulario
    var url = `?nombre= ` + nombre + `&apellido=` + apellido + `&email=` + email + `&rol=` + rol + `&password=` + password + `&id=` + id;

    userEdit(url, function(error, data){
        mostrarResultado(error, data); 
       
    });

    //recogemos la referencia al boton x para cerrar el modal, y lo pulsamos desde javascirpt. Si no, no se cierra el modal al pulsar a "Añandir"
    var cerrarEditarUser = document.getElementById("cerrarEditarUser");
    cerrarEditarUser.click();

};

/*==================================================================================================
=========================== MOSTRAR RESULTADO OPERACION ===========================================*/
/*==================================================================================================
==================================================================================================*/

function mostrarResultado(error, data){

    if (error){
        mensajeRespuesta.innerHTML = `<div class="alert alert-danger" role="alert">
        <strong>¡Oh vaya!</strong> Parece que algo no va bien, inténtelo un poco más tarde, por favor. 
        </div>
        `;
    }

    mensajeRespuesta.innerHTML = `<div class="alert alert-success" role="alert">
    <strong> ¡Hecho! La acción se ha realizado correctamente</div>`;

    //Hacemos que después de dos segundos el div con el mensaje de exito o error desaparezca
    
    setTimeout(function(){
    mensajeRespuesta.classList.add("hidden");
   }, 3000);

};

function rellenarEditarUser(id){
    
    var nombre = document.getElementById("nombreUserEDIT");
    var apellido = document.getElementById("apellidoUserEDIT");
    var email = document.getElementById("emailUserEDIT");
    var password = document.getElementById("passwordUserEDIT");
    var rol = document.getElementById("rolUserEDIT");

    nombre.value = usersList[id].NOMBRE;
    apellido.value = usersList[id].APELLIDO;
    email.value = usersList[id].EMAIL;
    password.value = usersList[id].PASSWORD;
    rol.value = usersList[id].ROL; 
    
    
}