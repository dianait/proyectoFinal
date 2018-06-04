var emailCapturado;


function generarCodigo(err, res){
    emailCapturado = document.getElementById("email").value ;
    console.log(emailCapturado);
    var email = emailCapturado.toLowerCase();
    var url = `?email=${email}`;

                
        if(email){
            codigoGenerated(url, (err, res)=>{
            if(err) throw err ;
                setTimeout(function (){console.log("función ejecutada")}, 5000);
                 return;
                }) ;

                }

       if(!email) console.log("Por favor, rellene el campo");

            }

      
function comprobarCodigo(){
    emailCapturado = "demo";

    var codigoIntroducido = document.getElementById("supuestoCodigo").value;

    var url = `comprobarCodigo/${emailCapturado}` ;

    comprobandoCodigo(url, codigoIntroducido) ;

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