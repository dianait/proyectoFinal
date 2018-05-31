const express = require('express');
const sqlite3 = require('sqlite3');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var nodemailer = require("nodemailer");
var fs = require("fs");
var csv = require("csv-stringify");
const app = express();
var path = require('path');
base_datos = new sqlite3.Database('proyectoweb.db',
    (err) => {
        if (err != null) {
            console.log('Error al abrir BD');
            process.exit();
        }
    }
);

var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
	  user: 'tecnologiasinteractivasEPSG@gmail.com',
	  pass: 'gti525gti'
	}
  });


  function enviarMail(origen, destinatario, asunto, mensaje){
	var mailOptions = {
		from: origen,
		to: destinatario,
		subject: asunto,
		html: mensaje
	  };

	  transporter.sendMail(mailOptions, function(error, info){
		if (error) {
		  console.log(error);
		} else {
		  console.log('Email enviado: ' + info.response);
		}
	  });

  }

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

/*
    Función para comprobar el login
    Si la cookie no está presente o es incorrecta se envia el formulario de acceso.
    En caso contrario se continua el proceso de la petición llamando a siguiente()
*/

function comprobar_login(peticion, respuesta, siguiente)
{
    if ('email' in peticion.cookies && 'password' in peticion.cookies) {
    base_datos.get('SELECT * FROM clientes WHERE email = ? AND password = ?',
            [ peticion.cookies.email, peticion.cookies.password ],
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
    }
}


app.get('/login', (peticion, respuesta) => {
    base_datos.get('SELECT * FROM clientes WHERE email=? AND password=?',
        [ peticion.query.email, peticion.query.password ],
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
app.get("/anyadirZona",  [comprobar_login, anyadirZona]);

function anyadirZona(peticion, respuesta) {
	var valorColor = '#'+peticion.query.color
	//Consulta para introducir los datos de la ZONA
	var queryAddZona = 'INSERT INTO zonas (NOMBRE, COLOR) VALUES(?,?)';
	//Consulta para introducir la conexión entre la ZONA y el cliente
	var queryAddZonaDos = 'INSERT INTO zonantes (ZONA, CLIENTE) VALUES (?,?)';
	//Consulta para recoger el ID del cliente
	var queryRecogerIdCliente = 'SELECT ID FROM clientes WHERE email=?';
	var idCliente;
	//Consulta para recoger el ID de la nueva ZONA
	var queryRecogerIdZonaNueva = 'SELECT VERTICE_ID FROM zonas WHERE NOMBRE=? AND COLOR=?';
	var idZona;
	console.log(peticion.query.nombre)
	console.log(peticion.query.email)
	console.log(valorColor)
	base_datos.get(queryRecogerIdCliente, [peticion.query.email], function(err, row){
		if(err){
			console.log("Error: "+ err)
			return
		}
		console.log(row)
		idCliente = row.ID;
		console.log(idCliente)
	} );
	
	base_datos.run(queryAddZona, [peticion.query.nombre, valorColor],
		(error) => {
			if (error) {
				console.log("error: " + error)

			} else {
				//Conexión en base de datos de la ZONA y el CLIENTE que la ha añadido
				base_datos.get(queryRecogerIdZonaNueva, [peticion.query.nombre, valorColor], function(err, row){
					if(err){
						console.log("Error: "+ err)
						return
					}
					console.log(row)
					idZona = row.VERTICE_ID
					console.log(idZona)
					base_datos.run(queryAddZonaDos, [idZona, idCliente] , function(error){
						if(error){
							console.log("Error: "+error)
							return
						}
						console.log("Zona creada correctamente");
					} )
				});
				
				
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
	
	enviarMail("tecnoligiasinteractivasEPSG@gmail.com", "mawco@gmail.com", "Código para cambiar contraseña", crearMail(codigoGenerado));

	res.status(200);

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

	var textoModificar = `UPDATE clientes set password='${pet.params.password}' where email='${pet.params.email}';`
			base_datos.run(textoModificar, function(err, row){
				if(err) throw err;
				respuesta.status(200).send({Servidor: "Contraseña cambiada correctamente."})
			});

} 

app.post("/sensor/data", function(peticion, respuesta){
	fs.appendFile('datos.txt', peticion.body, (err) => {
		if (err) throw err;
		console.log('The "data to append" was appended to file!');
	  });
});

/*---------------------------------------------------------------------------------
Función que devuelve un string con el codigo html del diseño del email a enviar al cliente cuando solicite cambiar contraseña
-----------------------------------------------------------------------------------

--> codigoGenerado: Z  => lo devuelve la función generarCodigo()                     
f()
--> String => se utiliza como parámetro en enviarMail(origen, destino, asunto, --> crearMail(CodigoGenerado) <-- );

-----------------------------------------------------------------------------------	*/

function crearMail(codigoGenerado){
	return ` <div style="width:500px;margin: 0 auto; text-align:center;padding:0.5rem;"><img class="logo" src="http://diaherso.upv.edu.es/images/logoGTI.svg" alt="logo GTI" /><br>
	<p>Este es tu codigo para cambiar tu contrasña<br/>
	<div style="width:100px;font-size:28px;padding:0.5rem;margin:0 auto;color:grey;border:2px solid #740070;text-align:center;">${codigoGenerado}</div>
	<p>Este codigo caducará en 10 minutos</p>
	<P>Si no has solicitado un cambio de contraseña, <br />rogamos nos lo hagas saber mediante este <a href="contacto.html">formulario</a></p>
	<p>Estamos a tu disposición,</p>
	<p>El equipo 8 de Tecnologías interactivas</p></div>`;
}


app.get("/mediciones/all", getmedicionesall);

function getmedicionesall(peticion, respuesta) {
	var queryMediciones = "SELECT * FROM medidas";

	base_datos.all(queryMediciones, function (error, mediciones) {
		if (error) {
			console.log("error: " + error)
		} else {
			respuesta.status(200).send(mediciones);
		}
	});
};

/*---------------------------------------------------------------------------------
url API para crear archivo CSV
	Fuente: https://stackoverflow.com/questions/10227107/write-to-a-csv-in-node-js
	
COMO ABRIR EL ARCHIVO CSV EN EXCEL PARA QUE SE VEA CORRECTAMENTE
	Fuente: https://www.geeknetic.es/Noticia/11610/Trucos-Como-abrir-correctamente-un-archivo-CSV-en-Excel.html
-----------------------------------------------------------------------------------
                  
f()

-----------------------------------------------------------------------------------	*/

app.get("/csv", function(peticion, respuesta){

	var columns = {
		id: "id",
		tiempo: "tiempo",
		temperatura: "temperatura",
		humedad: "humedad",
		salinidad: "salinidad",
		iluminacion: "iluminacion",
		presion: "presion"
	  };

	var queryMediciones = "SELECT * FROM medidas";
	base_datos.all(queryMediciones, function (error, mediciones) {
		
		if (error) {
			console.log("error: " + error)
		} 
		
		else {

			csv(mediciones, { header: true, columns: columns }, (err, output) => {
				var rutaFichero;
				var fecha = Date.now();
				if (err) throw err;
				fs.writeFile('frontend/exports/mediciones'+ fecha +'.csv', output, (err) => {
					if (err) throw err;
					rutaFichero = {ruta : '/exports/mediciones'+ fecha +'.csv'}
       				respuesta.status(200).send(rutaFichero);
				});
			});
			
		}
	});
       return;
});

function crearObjetoMediciones(array){
var datos = {
   mac : array["field1"],
   tiempo : array["field2"],
   lat : array["field3"],
   lng : array["field4"],
   alt : array["field5"],
   temperatura : array["field6"],
   humedad : array["field7"],
   salinidad : array["field8"],
   iluminacion : array["field9"],
   presion : array["field10"],
   alarma : array["field11"]
};
 return datos;
}


app.listen(app.get('port'), function () {
	console.log('Node está funcionando en el puerto: ', app.get('port'));
});

