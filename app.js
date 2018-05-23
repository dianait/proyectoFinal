const express = require('express');
const sqlite3 = require('sqlite3');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const app = express();
var path = require('path');
const moment = require('moment')
base_datos = new sqlite3.Database('proyectoweb.db',
    (err) => {
        if (err != null) {
            console.log('Error al abrir BD');
            process.exit();
        }
    }
);

/*=================== SETTINGS ======================
====================================================*/

app.set('port', (process.env.PORT || 4000));
app.use(express.static(path.join(__dirname, './frontend')));


/*=================== SETTINGS ======================
====================================================*/

/*=================== STATIC FILES===================
====================================================*/
app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
	extended: true
})); // for parsing application/x-www-form-urlencoded

/*=================== STATIC FILES===================
====================================================*/

/*=================== RUTAS =========================
====================================================*/
app.get('/', function (req, res) {
	res.sendFile("index.html");
});

app.get('/mapa', [comprobar_login, function (req, res) {
	res.sendFile(__dirname + "/frontend/mapa.html");
}]);

app.get('/perfil', [comprobar_login, function (req, res) {
	res.sendFile(__dirname + "/frontend/profile.html");
}]);

app.post('/login/:user/:pass', (req, res) =>{
	var username = req.params.user ;
	var password = req.params.pass ;

	if( !(username === 'demo' && password ==='demo')){
		res.status(401).send({error: 'usuario o contraseña inválidos'})
		return;
	}
	
	var datosAuth = {
		username: username
	}
	
	var token = jwt.sign(datosAuth, 'Secret Password', {
		expiresIn: 60 * 60 * 24 	// expirará en 24 horas
	});

	res.status(200).send({token})
}) ;

//app.get('/fichaToken', )

/*
    Función para comprobar el login
    Si la cookie no está presente o es incorrecta se envia el formulario de acceso.
    En caso contrario se continua el proceso de la petición llamando a siguiente()
*/

function comprobar_login(peticion, respuesta, siguiente)
{
    if ('email' in peticion.cookies && 'password' in peticion.cookies) {
    base_datos.get('SELECT * FROM clientes WHERE email = ? AND password = ?',
            [ peticion.cookies.email, hex_sha1(peticion.cookies.password) ],
                (error, fila) => {
                    if (error != null)
                        respuesta.sendStatus(500);
                    else if (fila === undefined)
					respuesta.sendStatus(404);
                    else siguiente()
                }
        )
    } else {
		respuesta.sendFile(__dirname + "/frontend/index.html");
		respuesta.status(200).send( {token })
    }
}


app.get('/login', (peticion, respuesta) => {
    base_datos.get('SELECT * FROM clientes WHERE email=? AND password=?',
        [ peticion.query.email, hex_sha1(peticion.query.password) ],
            (error, fila) => {
                if (fila === undefined) {
                    respuesta.sendStatus(401)
                } else {
                    respuesta.json(fila)
                }
        })
})


app.get("/activar", activarUsuario);

/* Método que permite activar a un usuario la primera vez que entra a la aplicación, para que lo lleve directamente a la página de zonas 
y no tengo que pasar por la página de perfil para confirmar sus datos porque ya lo ha hecho la primera vez que inició sesión */

function activarUsuario(req, res) {


	function activarUsuario2(err) {
		if (err) {
			console.log("error: " + err)
		} else {
			res.sendFile(__dirname + "/frontend/mapa.html");
		}

	}
	base_datos.get('UPDATE clientes SET activo=1 WHERE email=?', [req.query.email], activarUsuario2);
}
//-------------------------------------------------------------
//-------------------------------------------------------------
app.get("/sensores", [comprobar_login, pedirSensores]);

/* Método que permite activar a un usuario la primera vez que entra a la aplicación, para que lo lleve directamente a la página de zonas 
y no tengo que pasar por la página de perfil para confirmar sus datos porque ya lo ha hecho la primera vez que inició sesión */

function pedirSensores(req, res) {

	var querySensores = "SELECT sondas.* FROM sondantes INNER JOIN sondas ON sondas.ID_SONDA = sondantes.SONDA WHERE CLIENTE = (SELECT ID FROM clientes WHERE email=?)";
	function pedirSensores2(err, row) {
		if (err) {
			console.log("error: " + err)
		} else {

			res.send(row);
		}
	}
	base_datos.all(querySensores, [req.query.email], pedirSensores2);
}
//-------------------------------------------------------------
//-------------------------------------------------------------


/************** FUNCIÓN CREAR OBJETO ZONA *****************/
function crearObjetoZonas(x) {

	var objetoZona = {}; //variable objeto final
	var objetoVertice = {}; //variable objeto que contiene {LAT,LNG} vertice
	x.forEach(function (orden) {
		objetoZona.zona = orden.ZONA;
		objetoZona.nombre = orden.NOMBRE;
		objetoZona.color = orden.COLOR;
	});
	objetoZona.vertices = []; //array que contendra cada objeto vertice
	//ForEach que recoge cada row 
	x.forEach(function (orden) {

		objetoVertice = {
			lat: parseFloat(orden.LAT),
			lng: parseFloat(orden.LNG)
		};

		objetoZona.vertices.push((objetoVertice));


	});

	return objetoZona;
}

/********************************************************+*/
/* 
Método que permite saber las zonas que hay disponibles en la explotación agrícola, 
de momento la consulta es sobre clientes porque todavía no está la última versión de la base de datos 
*/

app.get("/zonas", [comprobar_login, pedirZonas]);

function pedirZonas(req, res) {

	//consulta para recoger las zonas que tiene el cliente
	var queryZonas = "SELECT ZONA FROM sondas_zonas LEFT JOIN clientes WHERE email=? GROUP BY ZONA;";
	//función que utiliza el resultado de la consulta anterior (numero de cada ZONA) para sacar los vertices de cada ZONA
	function pedirZonas2(err, row) {
		if (err) {
			console.log("error: " + err)
		} else {
			var arrayZonas = []; //declaración de un array que guardara todos los objetos de zona
			var Zona = {};
			var contadorZonas = 0;

			row.forEach(function (zona) {
				contadorZonas++;

				//Consulta que recoge la información de los vertices y zona, de cada una de las zonas que tiene un cliente
				var queryVertice = "SELECT vertice.* , zonas.* FROM vertice INNER JOIN zonas ON zonas.VERTICE_ID=vertice.ZONA WHERE VERTICE_ID=? GROUP BY ORDEN;";
				base_datos.all(queryVertice, [zona.ZONA], function (err, x) {
					if (err) {
						console.log("error: " + err);
					} else {
						Zona = crearObjetoZonas(x);

						arrayZonas.push(Zona); //añade cada objetoZona al final de un array
						/*Si el arrayZonas contiene el mismo numero de zonas que hemos sacado de la base de datos
						hace el envio de la arrayZonas que contiene un objeto por cada zona*/
						if (arrayZonas.length == contadorZonas) {
							res.json(arrayZonas);
						}
					}

				});
			});
		}
	}
	base_datos.all(queryZonas, [req.query.email], pedirZonas2);

}

/********************* HUMEDAD **********************/
app.get("/humedad", [comprobar_login, pedirHumedad]);
/* 
Método que permite mediciones de humedad de una sonda en concreto pasada como parámetro por la url
*/

function pedirHumedad(req, res) {

	var queryHumedad = "SELECT humedad FROM medidas WHERE id =?;";

	function pedirHumedad2(err, row) {
	
		if (err) {
			console.log("error: " + err)
		} else {
			
			res.send(row);
		}

	}
	base_datos.all(queryHumedad, [req.query.id], pedirHumedad2);

}

/*===================================================
====================================================*/

app.get("/temperatura",  [comprobar_login, pedirTemperatura]);

/* 
Método que permite mediciones de temperatura de una sonda en concreto
*/

function pedirTemperatura(req, res) {

	var queryTemperatura = "SELECT temperatura FROM medidas WHERE id =?;";

	function pedirTemperatura2(err, row) {
	
		if (err) {
			console.log("error: " + err)
		} else {
			
			res.send(row);
		}

	}
	base_datos.all(queryTemperatura, [req.query.id], pedirTemperatura2);

}

/*===================================================
====================================================*/

/******************* LUMINOSIDAD ********************/
app.get("/iluminacion",  [comprobar_login, pedirLuminosidad]);
/* 
Método que permite mediciones de luminosidad de una sonda en concreto pasada como parámetro por la url
*/

function pedirLuminosidad(req, res) {

	var queryLuminosidad = "SELECT iluminacion FROM medidas WHERE id =?;";

	function pedirLuminosidad2(err, row) {
		
		if (err) {
			console.log("error: " + err)
		} else {
			res.send(row);
		}

	}
	base_datos.all(queryLuminosidad, [req.query.id], pedirLuminosidad2);

}

/*===================================================
====================================================*/

/*===================================================
====================================================*/

/******************* SALINIDAD ********************/
app.get("/salinidad",  [comprobar_login, pedirSalinidad]);
/* 
Método que permite mediciones de salinidad de una sonda en concreto pasada como parámetro por la url
*/

function pedirSalinidad(req, res) {

	var querySalinidad = "SELECT salinidad FROM medidas WHERE id =?;";

	function pedirSalinidad2(err, row) {

		if (err) {
			console.log("error: " + err)
		} else {

			res.send(row);
		}

	}
	base_datos.all(querySalinidad, [req.query.id], pedirSalinidad2);

}

/*===================================================
====================================================*/
/*===================================================
====================================================*/
/*===================================================
====================================================*/
/*===================================================
====================================================*/
/*===================================================
====================================================*/
/*===================================================
====================================================*/
/*===================================================
====================================================*/
// NUEVO IMPLEMENTADO
/*===================================================
====================================================*/
/* Método que devuelve la lista de usuarios/empleados registrados de un cliente */
app.get("/usuarios",  [comprobar_login, getUsers]);

function getUsers(peticion, respuesta) {
	var queryUsers = "SELECT * FROM clientes";
	base_datos.all(queryUsers, function (error, fila) {
		if (error) {
			console.log("error: " + err)
		} else {
			respuesta.send(fila);
		}
	});
};

/*===================================================
====================================================*/

/*===================================================
====================================================*/
/* Método que añade un cliente a la base de datos */
app.get("/usuario",  [comprobar_login, addUser]);

function addUser(peticion, respuesta) {
	var queryAddUser = "INSERT INTO clientes(EMAIL, NOMBRE, APELLIDO, ROL, PASSWORD, ACTIVO) VALUES(?,?,?,?, 'segundoSprint', 0)";

	base_datos.run(queryAddUser, [peticion.query.email, peticion.query.nombre, peticion.query.apellido, peticion.query.rol],
		(error) => {
			if (error) {
				console.log("error: " + error)
			} else {

				console.log("Usario introducido correctamente");

			}
		});
};

/*===================================================
====================================================*/

/* Método que elimina a un usuario por id */
app.get("/EliminarUsuario",  [comprobar_login, deleteUser]);

function deleteUser(peticion, respuesta) {
	var queryDeleteUser = "DELETE FROM clientes WHERE id=?";
	base_datos.run(queryDeleteUser, [peticion.query.id], (error) => {
		if (error) {
			console.log("error: " + error)
		} else {

			console.log("Usario eliminado correctamente");
			respuesta.send("Usario eliminado correctamente");

		}
	});

};

/*===================================================
====================================================*/

/*===================================================
====================================================*/

/* Método que busca a un usuario por id */
app.get("/GetUsuario",  [comprobar_login, getUser]);

function getUser(peticion, respuesta) {
	var queryDeleteUser = "SELECT * FROM clientes WHERE id=?";
	base_datos.get(queryDeleteUser, [peticion.query.id], (error) => {
		if (error) {
			console.log("error: " + error)
		} else {

			console.log(fila);

		}
	});

};

/*===================================================
====================================================*/
/* Método que guarda los cambios en un usuario */

app.get("/editarUsuario",  [comprobar_login, editarUsuario]);

function editarUsuario(peticion, respuesta) {

	var queryEditUser = "UPDATE clientes SET EMAIL=?, NOMBRE=?, APELLIDO=?, ROL=?, PASSWORD=?, ACTIVO=? WHERE ID=?";
	var datosUsuario = [peticion.query.email,
		peticion.query.nombre,
		peticion.query.apellido,
		peticion.query.rol,
		peticion.query.password,
		peticion.query.activo,
		peticion.query.id
	];

	base_datos.run(queryEditUser, datosUsuario, (error) => {
		if (error) {
			console.log("error: " + error);	
			}
			console.log("Usuario actualizado correctamente");
	});

};

/*================= CRUD ZONAS ======================
====================================================*/
/*================= ADD ZONA ========================
====================================================*/
/* Método que añade una zona a la base de datos  */
app.get("/addZona",  [comprobar_login, addZona]);

function addZona(peticion, respuesta) {
	var queryAddZona = "INSERT INTO zonas (NOMBRE, COLOR) VALUES(?,?)";

	base_datos.run(queryAddZona, [peticion.query.nombre, peticion.query.color],
		(error) => {
			if (error) {
				console.log("error: " + error)
			} else {
				console.log("Zona creada correctamente");

			}
		});
};

/*===================================================
====================================================*/
/*============== DELETE ZONA ========================
====================================================*/
/* Método que ELIMINA una zona a la base de datos  */

app.get("/EliminarZona",  [comprobar_login, deleteZona]);

function deleteZona(peticion, respuesta) {

	var querySelectZona = "SELECT * FROM zonas WHERE VERTICE_ID=?";
	var queryDeleteZona = "DELETE FROM zonas WHERE VERTICE_ID=?";
	var queryDeleteVertices = "DELETE FROM vertice WHERE ZONA=?";
	var queryDeleteSondas = "DELETE FROM sondas_zonas WHERE ZONA=?";
	var queryDeleteAlertas = "DELETE FROM alertas WHERE zona=?";

	

	base_datos.get(querySelectZona, [peticion.query.id], function (error, row) {

		if (row) {

			base_datos.run(queryDeleteZona, [peticion.query.id], function (error){
				console.log("Zona eliminada correctamente");
			});

			base_datos.run(queryDeleteVertices, [peticion.query.id], function (error){
				console.log("Vertices eliminados correctamente");
			});

			base_datos.run(queryDeleteSondas, [peticion.query.id], function (error){
				console.log("Asociación de sondas borrada correctamente");
			});

			base_datos.run(queryDeleteAlertas, [peticion.query.id], function (error){
				console.log("Asociación de alertas borrada correctamente");
			});

		}
		console.log("No existe esa zona: " + error);
	});

}

/*===================================================
====================================================*/
/*============== EDITAR ZONA ========================
====================================================*/
/* Método que EDITA una zona a la base de datos  */

app.get("/editarZona",  [comprobar_login, editZona]);

function editZona(peticion, respuesta) {
	var queryEditZona = "UPDATE zonas SET NOMBRE=?, COLOR=? WHERE VERTICE_ID=?";
	var valorColor = '#'+peticion.query.color
	var datosZona = [peticion.query.nombre,
		valorColor,
		peticion.query.id
	];

	base_datos.run(queryEditZona, datosZona, (error) => {
		if (error) {
			console.log("error: " + error)
		} else {
			console.log("Zona actualizada correctamente");
		}
	});
};



/*===================================================
====================================================*/
/*============== GET ALERTAS ========================
====================================================*/
/* Método que devuelve un array con las alertas */

app.get("/alertas",  [comprobar_login, getAlertas]);

function getAlertas(peticion, respuesta) {
	var queryAlertas = "SELECT * FROM alertas";

	base_datos.all(queryAlertas, function (error, alertas) {
		if (error) {
			console.log("error: " + error)
		} else {
			respuesta.send(alertas);
		}
	});
};

/*===================================================
====================================================*/
/*============== VERTICES ===========================
====================================================*/

app.post('/vertices', [comprobar_login, (peticion, respuesta) => {
	var vertices = [];

	base_datos.run("DELETE FROM vertice WHERE ZONA=?", [peticion.body.zona], function (error){
		if (error) {console.log("problema al borrar: " + error )};
		console.log("Vertices eliminados correctamente");
	});
	  vertices = peticion.body.vertices;
	  for (var i = 0; i< vertices.length; i++){
		base_datos.run('INSERT INTO vertice (ZONA, ORDEN, LAT, LNG) VALUES(?,?,?,?)',[peticion.body.zona, (i + 1), vertices[i].lat, vertices[i].lng], (error) => {
			if (error) {console.log("problema al guardar los vertices: " + error)}
			console.log("vertices zona actualizados");
		
	
		});
	  };
  
}]);


app.listen(app.get('port'), function () {
	console.log('Node está funcionando en el puerto: ', app.get('port'));
});

/*===================================================
====================================================*/
/*============== PASSWORD ========================
====================================================*/
/* Método que DEVUELVE la contraseña de un usuario  */

function generarCodigo(){

	var x = parseInt(Math.random()* 99);

	var y = parseInt(Math.random() * 999);

	var pw = Number(x.toString() + y.toString())
	
	return pw;
}

function destruirCodigo(email){

	var queryDestruirCodigo = 'update clientes set codigoemail= null  where email=?'

	base_datos.run(queryDestruirCodigo, [email], (err, res)=>{
		if (err){
			console.log(err) ;
		}
	});

	console.log("Código destruido correctamente.");

}

app.get("/generarCodigo", ( pet, res ) =>{

	if(pet == null){

			res.status(400).send({message: "Introduzca un e-mail"}) ;

			return;

	}

	var queryE = "SELECT * FROM clientes where email =?";

	base_datos.get(queryE, [pet.query.email], (err, row)=>{

	var queryP = "UPDATE clientes SET codigoemail = ? WHERE email = ? ;" ;

	var codigoGenerado = generarCodigo();

	if(row){

	base_datos.run( queryP , [codigoGenerado , pet.query.email]) ;


	res.status(200).send({servidor: `El código de seguridad es: ${codigoGenerado}`}) ;

	console.log(`El código de seguridad es: ${codigoGenerado}`) ;

	//setTimeout(destruirCodigo(pet.query.email), 10000) ;

	res.end();

}
	
	if(!row){
		 console.log("no se ha encontrado el usuario") ;
		 res.end();
	}
	

})

});



app.get('/comprobarCodigo/:email/', comprobanding);

function comprobanding(pet, respuesta){

	var queryC = `SELECT codigoemail FROM clientes WHERE email='${pet.params.email}';` ;

	base_datos.get(queryC, (err, row)=>{

		respuesta.status(200).send(row);

		//respuesta.json(row);

	});


}

app.get('/cambiarPassword/:email/:password', cambiarContrasenya) ;

function cambiarContrasenya (pet, respuesta) {

	console.log("email: "+pet.params.email);	//para ver que la petición que le llega es el e-mail

	var textoModificar = `UPDATE clientes set password='${hex_sha1(pet.params.password)}' where email='${pet.params.email}';`
			base_datos.run(textoModificar, function(err, row){
				if(err) throw err;
				respuesta.status(200).send({Servidor: "Contraseña cambiada correctamente."})
			});

} // cambiaPassword()

var hexcase=0;var b64pad="";function hex_sha1(a){return rstr2hex(rstr_sha1(str2rstr_utf8(a)))}function hex_hmac_sha1(a,b){return rstr2hex(rstr_hmac_sha1(str2rstr_utf8(a),str2rstr_utf8(b)))}function sha1_vm_test(){return hex_sha1("abc").toLowerCase()=="a9993e364706816aba3e25717850c26c9cd0d89d"}function rstr_sha1(a){return binb2rstr(binb_sha1(rstr2binb(a),a.length*8))}function rstr_hmac_sha1(c,f){var e=rstr2binb(c);if(e.length>16){e=binb_sha1(e,c.length*8)}var a=Array(16),d=Array(16);for(var b=0;b<16;b++){a[b]=e[b]^909522486;d[b]=e[b]^1549556828}var g=binb_sha1(a.concat(rstr2binb(f)),512+f.length*8);return binb2rstr(binb_sha1(d.concat(g),512+160))}function rstr2hex(c){try{hexcase}catch(g){hexcase=0}var f=hexcase?"0123456789ABCDEF":"0123456789abcdef";var b="";var a;for(var d=0;d<c.length;d++){a=c.charCodeAt(d);b+=f.charAt((a>>>4)&15)+f.charAt(a&15)}return b}function str2rstr_utf8(c){var b="";var d=-1;var a,e;while(++d<c.length){a=c.charCodeAt(d);e=d+1<c.length?c.charCodeAt(d+1):0;if(55296<=a&&a<=56319&&56320<=e&&e<=57343){a=65536+((a&1023)<<10)+(e&1023);d++}if(a<=127){b+=String.fromCharCode(a)}else{if(a<=2047){b+=String.fromCharCode(192|((a>>>6)&31),128|(a&63))}else{if(a<=65535){b+=String.fromCharCode(224|((a>>>12)&15),128|((a>>>6)&63),128|(a&63))}else{if(a<=2097151){b+=String.fromCharCode(240|((a>>>18)&7),128|((a>>>12)&63),128|((a>>>6)&63),128|(a&63))}}}}}return b}function rstr2binb(b){var a=Array(b.length>>2);for(var c=0;c<a.length;c++){a[c]=0}for(var c=0;c<b.length*8;c+=8){a[c>>5]|=(b.charCodeAt(c/8)&255)<<(24-c%32)}return a}function binb2rstr(b){var a="";for(var c=0;c<b.length*32;c+=8){a+=String.fromCharCode((b[c>>5]>>>(24-c%32))&255)}return a}function binb_sha1(v,o){v[o>>5]|=128<<(24-o%32);v[((o+64>>9)<<4)+15]=o;var y=Array(80);var u=1732584193;var s=-271733879;var r=-1732584194;var q=271733878;var p=-1009589776;for(var l=0;l<v.length;l+=16){var n=u;var m=s;var k=r;var h=q;var f=p;for(var g=0;g<80;g++){if(g<16){y[g]=v[l+g]}else{y[g]=bit_rol(y[g-3]^y[g-8]^y[g-14]^y[g-16],1)}var z=safe_add(safe_add(bit_rol(u,5),sha1_ft(g,s,r,q)),safe_add(safe_add(p,y[g]),sha1_kt(g)));p=q;q=r;r=bit_rol(s,30);s=u;u=z}u=safe_add(u,n);s=safe_add(s,m);r=safe_add(r,k);q=safe_add(q,h);p=safe_add(p,f)}return Array(u,s,r,q,p)}function sha1_ft(e,a,g,f){if(e<20){return(a&g)|((~a)&f)}if(e<40){return a^g^f}if(e<60){return(a&g)|(a&f)|(g&f)}return a^g^f}function sha1_kt(a){return(a<20)?1518500249:(a<40)?1859775393:(a<60)?-1894007588:-899497514}function safe_add(a,d){var c=(a&65535)+(d&65535);var b=(a>>16)+(d>>16)+(c>>16);return(b<<16)|(c&65535)}function bit_rol(a,b){return(a<<b)|(a>>>(32-b))};