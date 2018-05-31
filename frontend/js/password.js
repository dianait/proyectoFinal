var emailCapturado;


function generarCodigo(err, res){
    emailCapturado = document.getElementById("email").value ;
    console.log(emailCapturado);
    var email = emailCapturado.toLowerCase();
    var url = `?email=${email}` ;

                
        if(email){
            codigoGenerated(url, (err, res)=>{
            if(err) throw err ;
                setTimeout(function (){console.log("función ejecutada")}, 5000);
                 return;
                }) ;

                }

       if(!email) console.log("Por favor, rellene el campo");

         var seccion = document.getElementsByClassName("recuperar-contraseña") ;
            }

     function dibujarCodigo(){

        var seccion = document.getElementById("container");

        var codigo = document.getElementById("container-principal");

        var email = document.getElementById("email");

           seccion.style.display="none";

           codigo.innerHTML = `<section id="seccion"></section><div id="contenedor-password"><input class="form-control form-control-lg" type="text" placeholder="*****" id="supuestoCodigo" autofocus maxlength="5"></div>
           <button type="submit" class="btn btn-primary" id="botonEnviar" onclick="comprobarCodigo()">Enviar</button>
       

           <a href="#!" class="list-group-item list-group-item-action list-group-item-info" id="containerReloj">
               <div id="reloj">
                   <div>
                       <span class="minutos"></span>
                       <div class="texto">Minutos</div>
                   </div>
                   <div>
                       <span class="segundos"></span>
                       <div class="texto">Segundos</div>
                   </div>
               </div>
           </a>
           <button type="button" class="btn btn-warning" id="warning">El código se destruirá pasado el tiempo</button></section>`

     function getTimeRemaining(endtime) {
        var t = Date.parse(endtime) - Date.parse(new Date());
        var segundos = Math.floor((t / 1000) % 60);
        var minutos = Math.floor((t / 1000 / 60) % 60);

        return {
            'total': t,
            'minutos': minutos,
            'segundos': segundos
        };
    }

    function initializeReloj(id, endtime) {
        var reloj = document.getElementById(id);

        var minutoSpan = reloj.querySelector('.minutos');
        var segundoSpan = reloj.querySelector('.segundos');

        function updateReloj() {
            var t = getTimeRemaining(endtime);

            minutoSpan.innerHTML = ('0' + t.minutos).slice(-2);
            segundoSpan.innerHTML = ('0' + t.segundos).slice(-2);
            if (t.total <= 0) {
                clearInterval(timeinterval);
            }
        }
        updateReloj();
        var timeinterval = setInterval(updateReloj, 1000);
    }

    var deadline = new Date(Date.parse(new Date()) + 5 * 60 * 1000);
    initializeReloj('reloj', deadline);

      }

      
function comprobarCodigo(){


    var codigoIntroducido = document.getElementById("supuestoCodigo").value;

    var url = `comprobarCodigo/${emailCapturado}` ;

    comprobandoCodigo(url, codigoIntroducido) ;

}

function dibujarPassword(){

    console.log("dibujarPassword() ON");

    var seccion = document.getElementById("container-principal");

    seccion.style.display="none";

    var contenedor = document.getElementById("contenedor");

    contenedor.innerHTML = `

    <label class="texto"> Introduzca una nueva contraseña </label>
    
    Contraseña: <input type="password" id="clave1" value="" size="20">
    <br>
    Repite contraseña: <input type="password" id="clave2" value="" size="20">
    <br>
    <button type="submit" class="btn btn-primary" id="botonEnviar" onclick="comprobarClave()">Enviar</button>`

}

function comprobarClave(){

    var email = "demo";
   var clave1 = document.getElementById("clave1").value
   var clave2 = document.getElementById("clave2").value
    if (clave1 != clave2){
        console.log("Las claves no son iguales")
    }
    else{
        changePassword(email, clave1);
    }
} 