var tipoSensores, email, zonas, marcadores, listaMarcadores, alertasguardadas, mapa;
//-----------------------------------------------------------------------------------
//Función anónima autoejecutable para recoger el email del usuario logueado
//-----------------------------------------------------------------------------------
(function () {

	tipoSensores = ["Humedad", "Salinidad", "Iluminacion", "Temperatura"];
	email = getCookie("email");
	marcadores = false;
	listaMarcadores = [];
	var listaAlertas = document.getElementById("listaAlertas");
	alertasguardadas = [];

	sensoresGet(email, function (datosSondas) {
		datosSondas.forEach(function (sonda) {
			listaMarcadores.push(sonda);

		});

	});

	alertasGet(function (alertas) {
		alertas.forEach(function (alerta) {
			alertasguardadas.push(alerta);
			
		});

		rellenar(listaAlertas, alertas);
		document.getElementById("numAlertas").innerHTML = alertasguardadas.length;

	});

})();


//-----------------------------------------------------------------------------------
calcularMediasSondas(tipoSensores, email);
document.getElementById("desplegable").selectedIndex = 0;
var f = new Date();
var zonas = [];
var coloresSensor = {};
coloresSensor.humedad = "rgb(88,172,250)";
coloresSensor.humedadOpacidad = "rgb(88,172,250, 0.2)";
coloresSensor.temperatura = "rgb(250,88,88)";
coloresSensor.temperaturaOpacidad = "rgb(250,88,88, 0.2)";
coloresSensor.iluminacion = "rgb(255,128,0)";
coloresSensor.iluminacionOpacidad = "rgb(255,128,0, 0.2)";
coloresSensor.salinidad = "rgb(95,76,11)";
coloresSensor.salinidadOpacidad = "rgb(95,76,11, 0.2)";


function enableZoom(map) {
	map.setOptions({
		scrollwheel: true,
		disableDoubleClickZoom: false
	});
}

function disableZoom(map) {
	map.setOptions({
		scrollwheel: false,
		disableDoubleClickZoom: true
	});
}

function initMap() {

	mapa = new google.maps.Map(document.getElementById("mapa"), {
		zoom: 17,
		center: {
			lat: 38.980868,
			lng: -0.174966
		},
		disableDefaultUI: true,
		scrollwheel: false,
		disableDoubleClickZoom: true,
		/* mapTypeId: google.maps.MapTypeId.SATELLITE, */
		// mapTypeId: 'satellite'
		streetViewControl: false
	});

	mapa.setMapTypeId('satellite');
	// mapa.setStreetViewContro('false');
	cargarZonas();



}
var divZonas = document.getElementById("zonas");

function cargarZonas() {

	var desplegable = document.getElementById("desplegable");

	zonasGet(email, function (datos) {
		datos.forEach(function (datosZona) {

			var opt = document.createElement('option');
			opt.value = datosZona.zona;
			opt.innerHTML = datosZona.nombre;
			desplegable.appendChild(opt);
			var path = new google.maps.MVCArray();
			var limites = new google.maps.LatLngBounds();

			datosZona.vertices.forEach(function (vertice) {
				var ll = new google.maps.LatLng(parseFloat(vertice.lat), parseFloat(vertice.lng));
				path.push(ll);
				limites.extend(vertice);
			});



			var zona = {};
			zona.color = datosZona.color;
			zona.id = datosZona.zona;
			zona.nombre = datosZona.nombre;

			zona.poligono = new google.maps.Polygon({
				paths: path,
				strokeColor: datosZona.color,
				fillColor: datosZona.color,
				geodesic: true
			});



			zonas.push(zona);



		});

	});

}

//-----------------------------------------------------------------------------------
//Función que cada vez que arrastras un vertice o creas otro lo añade al array vertices
// fuente ==> https://duncan99.wordpress.com/2015/10/16/google-maps-editable-polylines/
//-----------------------------------------------------------------------------------

// --> path: google.maps.MVCArray<google.maps.LatLng>
//f()
// 

//-----------------------------------------------------------------------------------

var vertices = [];

function updateCoords(path) {
	vertices = [];
	path.forEach(function (element) {
		var vertice = {};
		vertice.lat = element.lat();
		vertice.lng = element.lng();
		vertices.push(vertice);
	});

}

//-----------------------------------------------------------------------------------
//Función a partir del array creado en updateCoords actualiza la base de datos
//-----------------------------------------------------------------------------------

// --> id: Z id de la zona a actualizar
// --> vertices: array de vertices rellenado en la función updateCoords  !!!!! DEBERÍA SER UN PARÁMETRO DE LA FUNCIÓN
// VERTICES no se le pasa como paremetro se crea de manera global, porque me daba problemas y no insertaba bien los datos
//	
//  body: JSON.stringify({
//	zona: id,
//	vertices: --> vertices <--
//  })
//
//f()
// 

//-----------------------------------------------------------------------------------

function guardarVertices(id) {

	if (vertices.length > 0) {
		verticesUpdate(id, vertices);
	}
};

function getFotoZona() {
	var imagen = document.getElementById("fotoZona");
	//imagen.remove();

	var options = {
		width: 450,
		hieght: 100,
		scrollY: 200,
		x: 200,
		y: 220,
		allowTaint: true
	};



	html2canvas(document.querySelector("#mapa"), options).then(canvas => {
		imagen.prepend(canvas);

	});

}

//-----------------------------------------------------------------------------------
//Función que se activa al querer guardar los cambios en la zona
//-----------------------------------------------------------------------------------

// --> id: Z ==> número identificativo de la zona a actualizar
// 

//-----------------------------------------------------------------------------------
function guardarZona(id){
	//recogemos los valores del formulario
	var nombre = document.getElementById("inputZona").value;
	var color = document.getElementById("inputColor").value;
	//console.log(id)
	color = color.split('#')[1];
	//console.log(color)
	if(vertices.length != 0){
		guardarVertices(id)
	}
	//parámetros para la petición a la api con los datos recogidos del formulario
	var trozoUrl = `?nombre=`+nombre+`&color=`+color+`&id=`+id;
	//console.log(trozoUrl)
	zonaEditar(trozoUrl, function (res){
		console.log(res)
	});

	var msgUpdateZona = document.getElementById("msgUpdateZona");
	msgUpdateZona.innerHTML = `<div class="alert alert-success" role="alert">
    <strong>¡Perfecto!</strong> Zona actualizada correctamente
</div>`;

	msgUpdateZona.style.display = "block";

	setTimeout(function () {
		msgUpdateZona.style.display = "none";
		document.getElementById("cerrarModal").click();
	}, 3000);

	
}

//-----------------------------------------------------------------------------------
//Función que se activa presionar sobre el icono editar de una zona 
//-----------------------------------------------------------------------------------

// --> id: Z ==> número identificativo de la zona a actualizar
// 

//-----------------------------------------------------------------------------------
function editarZona(id) {
	id = id + 1;
	zonas[id].poligono.setEditable(!zonas[id].poligono.getEditable());

	// fuente ==> https://duncan99.wordpress.com/2015/10/16/google-maps-editable-polylines/

	zonas[id].poligono.getPath().addListener('insert_at', function (vertex) {
		updateCoords(this);
	});

	zonas[id].poligono.getPath().addListener('set_at', function (vertex) {
		updateCoords(this);
	});

	zonas[id].poligono.getPath().addListener('remove_at', function (vertex) {
		updateCoords(this);
	});

	google.maps.event.addListener(zonas[id].poligono, 'dragend', function (event) {
		console.log('Drag');
		console.log(event);
	});

	// fuente ==> https://duncan99.wordpress.com/2015/10/16/google-maps-editable-polylines/

	//Incio => ESTO ES PARA LA VENTANA EMERGENTE QUE SALE AL PULSAR EL ICONO DE GUARDAR
	var titleZonaAdd = document.getElementById("titleZonaAdd");
	titleZonaAdd.style.color = "white";
	titleZonaAdd.style.backgroundColor = zonas[id].color;
	titleZonaAdd.innerHTML = "ACTUALIZAR zona de " + zonas[id].nombre;
	var infoZona = document.getElementById("infoZona");
	infoZona.style.backgroundColor = "white";
	infoZona.style.position = "absolute";
	infoZona.style.top = "285px";
	infoZona.style.width = "91%";
	var prueba = `<div class="card-body">
	  <h5 class="card-title">` + zonas[id].nombre + `</h5>
	   Número de vértices: ` + zonas[id].poligono.getPath().getArray().length +
		`<br/>color: <div style="display:inline-block;background:` + zonas[id].color + `;width:20px;height:20px;border:1px solid grey;"></div>
	  <hr /> 
	  ¿Seguro que quiere actualizar la zona con estos datos? 
	  <br /><br /><button style="width:100px;float:right;margin:0.2rem;" class="btn btn-outline-success" onclick="guardarZona(`+ zonas[id].id +`)" >SI</button>
	  <button style="width:100px;float:right;margin:0.2rem;" data-dismiss="modal" class="btn btn-outline-danger">NO</button>
	</div>
  </div>`;

	infoZona.innerHTML = prueba;

	// Fin => ESTO ES PARA LA VENTANA EMERGENTE QUE SALE AL PULSAR EL ICONO DE GUARDAR

	var opciones = document.getElementById("opciones");
	opciones.innerHTML =
		//
		`<img id="guardarZona" src="./images/savewhite.svg" alt="icono guardar" data-toggle="modal" data-target="#updateZona" onclick="getFotoZona()" />`;

	var zona_btn = document.getElementById("formEditarZona");
	zona_btn.innerHTML = `
						<form id="formularioZona">
							<input id="inputZona" class="form-control" type="text" onfocus="this.value = this.value"; value=" ` +
		zonas[id].nombre + `" />
							<label for="inputColor">Color:</label>
							<input class="form-control" type="color" id="inputColor" value=` + zonas[id].color + `  />
		
						</form>`;

	//COLOCAMOS EL CURSOS AL FINAL DEL TEXTO EN EL INPUT DEL NOMBRE DE LA ZONA
	cursoralFinal(document.getElementById("inputZona"), zonas[id].nombre);

}

function cargarSensores() {


	listaMarcadores.forEach(function (sonda) {

		var alerta = getAlerta(sonda, alertasguardadas);

		crearMarcador(sonda, alerta);
	});
	marcadores = true;
}

var infowindow;

function crearMarcador(sonda, alerta) {
	numSonda = sonda.ID_SONDA;

	var contentString =
		'<div id="contentInfo">' +
		'<div id="siteNotice">' +
		'</div>' +
		'<div id="headerZona"><div><h2 id="firstHeading" class="firstHeading">SONDA ' + sonda.ID_SONDA +
		'</h2></div>' /* <span id="bateria"><img src="./images/battery.png" alt="bateria"><span class="badge badge-danger">8%</span></span> */ + '</div>' +
		'<div id="bodyContent">' +
		'<p style="background:grey;text-align:center;padding:0.3rem 0;" class="text-light">Última medición hace 5 minutos <br /> (' + f.getDate() + "/" + (f.getMonth() + 1) + "/" + f.getFullYear() +
		" - " + f.getHours() + ":" + (f.getMinutes() - 5) + ":" + f.getSeconds() + ')</p>' +
		`<ul id="iconosSensoresUtimaMedicion">
		<li onclick="mostrarDatos(this)"  data-toggle="modal" data-target="#exampleModal">
		<div class="containerLastMesure">
		<div class="level">
		  <div class="nivelTemperatura"></div>
		    <div class="nivelTemperatura"></div>
		    <div class="nivelTemperatura"></div>
		    <div class="nivelTemperatura"></div>
		    <div class="nivelTemperatura"></div>
		    <div class="nivelTemperatura"></div>
		    <div class="nivelTemperatura"></div>
		    <div class="nivelTemperatura"></div>
		    <div class="nivelTemperatura"></div>
		    <div class="nivelTemperatura"></div>
	  
		</div>
		<div class="okSensor">
		  <div class="ok" id="temperatura">
		  	<i class="fa fa-check-circle"></i>
		  </div>
		  <div class="iconoLevelSensor">
			  <img src="./images/sensores/temperatura.svg"  alt="icono temperatura" />
		  </div>
		</div>
	  </div>
		</li>
		<li onclick="mostrarDatos(this)"  data-toggle="modal" data-target="#exampleModal">
		  <div class="containerLastMesure">
		<div class="level">
		  <div  class="nivelSalinidad"></div>
		   <div  class="nivelSalinidad"></div>
		   <div  class="nivelSalinidad"></div>
		   <div  class="nivelSalinidad"></div>
		   <div  class="nivelSalinidad"></div>
		   <div  class="nivelSalinidad"></div>
		   <div  class="nivelSalinidad"></div>
		   <div  class="nivelSalinidad"></div>
		   <div  class="nivelSalinidad"></div>
		   <div  class="nivelSalinidad"></div>
	  
		</div>
		<div class="okSensor">
		  <div class="ok" id="salinidad">
		  <i class="fa fa-check-circle"></i>
		  <div class="iconoLevelSensor">
		  <img src="./images/sensores/salinidad.svg" alt="icono salinidad" />
			   </div>
		</div>
	  </div>
		</li>
		<li onclick="mostrarDatos(this)"  data-toggle="modal" data-target="#exampleModal">
		<div class="containerLastMesure">
		<div class="level">
		  <div class="nivelHumedad"></div>
		    <div class="nivelHumedad"></div>
		    <div class="nivelHumedad"></div>
		    <div class="nivelHumedad"></div>
		    <div class="nivelHumedad"></div>
		    <div class="nivelHumedad"></div>
		    <div class="nivelHumedad"></div>
		    <div class="nivelHumedad"></div>
		    <div class="nivelHumedad"></div>
		    <div class="nivelHumedad"></div>
	  
		</div>
		<div class="okSensor">
		  <div class="ok" id="humedad">
		  <i class="fa fa-check-circle"></i>
		  </div>
		  <div class="iconoLevelSensor">
			  <img src="./images/sensores/humedad.svg"  alt="icono humedad" />
			   </div>
		</div>
	  </div>
		</li>
		  <li onclick="mostrarDatos(this)"  data-toggle="modal" data-target="#exampleModal">
		  <div class="containerLastMesure">
		<div class="level">
		  <div class="nivelIluminacion"></div>
		  <div class="nivelIluminacion"></div>
		  <div class="nivelIluminacion"></div>
		  <div class="nivelIluminacion"></div>
		  <div class="nivelIluminacion"></div>
		  <div class="nivelIluminacion"></div>
		  <div class="nivelIluminacion"></div>
		  <div class="nivelIluminacion"></div>
		  <div class="nivelIluminacion"></div>
		  <div class="nivelIluminacion"></div>
			
		</div>
		<div class="okSensor">
		  <div class="ok" id="iluminacion">
		  <i class="fa fa-check-circle"></i>
		  </div>
		  <div class="iconoLevelSensor">
		  <img src="./images/sensores/iluminacion.svg" alt="icono iluminacion" />
			   </div>
		</div>
	  </div>
		</li>
	  </ul>` +
		'</div>';

	var latLng = new google.maps.LatLng(sonda.LAT, sonda.LNG);

	var marker = new google.maps.Marker({
		position: latLng,
		animation: google.maps.Animation.DROP,
		map: mapa

	});

	infowindow = new google.maps.InfoWindow({
		content: "loading...",
		//maxWidth: 900 //especifica el ancho máximo de la ventana de información en píxeles.
	});
	marker.addListener('click', function () {
		if (infowindow) {
			infowindow.close();
		};

		infowindow.setContent(contentString);

		infowindow.open(mapa, marker);




		/* tipoSensores = ["Humedad", "Salinidad", "Iluminacion", "Temperatura"]; */
		ultimosValores(tipoSensores, email, sonda.ID_SONDA);
		var lista = document.getElementById("iconosSensoresUtimaMedicion").getElementsByTagName("img");
		mostrarAlerta(lista, alerta);

	});

}

function seleccionarZona(elemento) {

	//OCULTAMOS EL AVISO DE QUE NO HAY NINGUNA ZONA SELECCIONADA MEDIANTE EL PRIMER ELEMENTO ([0]) DE LA CLASE "AVISO"
	//Sólo existe ese elemento con esa clase, pero igualmente getElementsByClassName devuelve un array, por lo que hay que decirle que índice de ese array queremos utilizar
	document.getElementsByClassName("aviso")[0].style.display = "none";

	//PONEMOS LA OPACIDAD DEL DIV QUE CONTIENE EL MAPA OTRA VEZ A 1 PARA QUE SE VEA BIEN
	//En un primer momoento, la opacidad estará a 0.6 mediante css atacando al div que contiene el mapa (div id="mapa"), sólo se cambiará a 1 cuando seleccionemos una ZONA
	document.getElementById("mapa").style.opacity = 1;
	//Ocultamos el div con color negro atenuado que hay justo encima del mapa
	document.getElementById("deshabilitar").style.display = "none";


	var numeroAlertas = document.getElementById("numAlertas");
	var listaAlertas = document.getElementById("listaAlertas");
	var iconoAlertas = document.getElementById("iconoAlertas");

	if (document.getElementById("desplegable")) {
		var zonaSeleccionada = document.getElementById("desplegable").selectedIndex;
		var desplegable = document.getElementById("desplegable");
		desplegable.style.display = "none";
		var ir = document.getElementById("irSeleccionarZona");
		ir.style.display = "none";
	}

	if (!marcadores) {

		cargarSensores();


	}

	if (elemento) {
		var numeroSonda = elemento.getAttribute("id");
		id = elemento.getAttribute("name");
		var idAlerta = elemento.getAttribute("alerta");
		elemento.parentNode.style.backgroundColor = "lightgrey";

		crearMarcadorConAlerta(listaMarcadores[numeroSonda - 1], alertasguardadas[idAlerta - 1]);

		if (numeroAlertas.innerHTML == 1) {
			numeroAlertas.style.display = "none";

			elemento.style.display = "none";
			listaAlertas.style.display = "none";

		}

	} else {
		id = zonaSeleccionada - 1;
	}

	var botonZona = document.getElementById("zonas");
	botonZona.classList.add("zonaSeleccionada");
	if (elemento) id = id - 1;
	botonZona.innerHTML =
		`
		   <a href="/mapa">
		   <img class="volver" id="volver" src="./images/atras.svg" alt="volver"/>
		   </a>
		   

		 <div id="formEditarZona">
		   <div width="200px"class="zona btn" id="zona_btn">
		   <h4 id="nombreZona" > <strong>` +
		zonas[id].nombre.toUpperCase() +
		`</strong></h4></div>
		   </div>

		   <div id="opciones">

		   <img id="editarZona" src="./images/editwhite.svg" alt="editar" onclick="editarZona(` + (id - 1) + `)">

		   <img width="100px" id="eliminarZona" src="./images/deletewhite.svg" alt="eliminar" onclick="activarEliminar(` + (id - 1) + `)" >

		   </div>

		   `;


	var fondoZonas = document.getElementById("zonas");
	fondoZonas.style.background = zonas[id].color;
	zonasGet(email, function (datos) {
		datos.forEach(function (datosZona) {

			var limites = new google.maps.LatLngBounds();
			datos[id].vertices.forEach(function (vertice) {
				vertice.lat = parseFloat(vertice.lat);
				vertice.lng = parseFloat(vertice.lng);
				limites.extend(vertice);
			});

			if (zonas[id].poligono.getMap() == undefined) {
				zonas[id].poligono.setMap(mapa);
				mapa.fitBounds(limites, 20);
			}

		});

	});

}

//-----------------------------------------------------------------------------------
//Función que crea la gráfica y la muestra en un elemento canvas 
//-----------------------------------------------------------------------------------

// --> array: <elemento: Z>, tipo: TEXT
//f()
// 

//-----------------------------------------------------------------------------------

function crearGrafica(medidasSensor, tipo) {

	var sensorValorMedio = document.getElementById("sensorValorMedio");
	var valorMedio = document.getElementById("valorMedio");
	sensorValorMedio.innerText = tipo.toUpperCase();
	var media = calcularMedia(medidasSensor);

	switch (tipo) {
		case "temperatura":
			valorMedio.innerText = media + " ºC";
			break;
		case "iluminacion":
			valorMedio.innerText = media + " lux";
			break;
		default:
			valorMedio.innerText = media + " %";
	}


	opciones = {};
	opciones.salinidad = {
		max: 23,
		min: 0,
		step: 20

	}

	opciones.humedad = {
		max: 48,
		min: 0,
		step: 20

	}

	opciones.iluminacion = {
		max: 86.01000000000022,
		min: 6200,
		step: 50

	}

	opciones.temperatura = {
		max: 0.2,
		min: 20.1,
		step: 0.3

	}

	var graficaTemperatura = {
		numeroDeMediciones: 8,
		valorMaximo: Math.max.apply(null, medidasSensor),
		valorMinimo: Math.min.apply(null, medidasSensor),
		valoresSensor: medidasSensor

	};

	var inicio = moment(graficaTemperatura.valorMinimo);

	var ejeY = {
		ticks: {
			max: graficaTemperatura.valorMaximo + opciones[tipo].max,
			stepSize: opciones[tipo].step,
			min: opciones[tipo].min
		}
	};

	var opciones = {
		responsive: true,
		maintainAspectRatio: true,
		scales: {
			yAxes: [ejeY]
		}
	};

	var datos = {
		labels: [],
		datasets: []
	};

	var contDias = 0;
	while (datos.labels.length < graficaTemperatura.numeroDeMediciones) {
		var dia = moment(inicio).add(contDias, 'h');
		datos.labels.push(dia.format('HH:mm'));
		//aquí añadiremos las horas en las que se toman las mediciones
		//sacar de la base de datos
		contDias++;
	}

	var lineaTemperatura = {
		label: tipo.toUpperCase(),
		backgroundColor: coloresSensor[tipo + "Opacidad"],
		borderColor: coloresSensor[tipo],
		fill: true,
		borderWidth: 1,
		lineTension: 0,
		data: []
	};

	lineaTemperatura.data[0] = graficaTemperatura.valoresSensor[0];
	for (let i = 1; i < datos.labels.length; i++) {
		lineaTemperatura.data[i] = graficaTemperatura.valoresSensor[i];
	}

	datos.datasets = [lineaTemperatura];

	var ctx = document.getElementById('grafica').getContext('2d');

	var chart = new Chart(ctx, {
		type: 'line',
		data: datos,
		options: opciones
	});

}

//-----------------------------------------------------------------------------------
//Función que reoge los datos de cada sensor y los muestra en la gráfica
//-----------------------------------------------------------------------------------

// --> Element HTML: <button><img /></button> clicado que contiene en nombre de la zona, el número de sonda, y el tipo de sensor en sus atributos
//f()
// 

//-----------------------------------------------------------------------------------

function mostrarDatos(elemento) {

	var listaBotones = elemento.parentNode.parentNode;
	listaBotones = listaBotones.getElementsByTagName("img");
	setActivar(listaBotones);
	var img = elemento.getElementsByTagName('img')[0];
	img.classList.add("activo");
	var alt = img.alt;
	var tipo = alt.split(" ")[1];
	var nombreZona = document.getElementById("nombreZona").innerText;

	var numeroSonda = document.getElementById("firstHeading");
	numeroSonda = numeroSonda.innerText.split(" ")[1];

	var tituloSensor = document.getElementById("exampleModalLabel");
	tituloSensor.innerHTML = nombreZona.toUpperCase() + " || SONDA " + numeroSonda;
	var valoresSensor = [];
	var sondaNumero = document.getElementById("firstHeading").innerText.split(" ")[1];

	valoresGet(tipo, email, sondaNumero, function (objetoJson) {
		for (i in objetoJson) {

			valoresSensor.push(objetoJson[i][tipo]);
		}

		crearGrafica(valoresSensor, tipo);

	});


}

function mostrarDatosAlertas(alerta) {
	var nombreZona = alerta.zona;
	var numeroSonda = alerta.sonda;

	var tituloSensor = document.getElementById("exampleModalLabel");
	tituloSensor.innerHTML = nombreZona.toUpperCase() + " || SONDA " + numeroSonda;
	var valoresSensor = [];

	valoresGet(tipo, email, numeroSonda, function (objetoJson) {
		for (i in objetoJson) {

			valoresSensor.push(objetoJson[i][tipo]);
			console.log(objetoJson[i]);
		}

		crearGrafica(valoresSensor, tipo);

	});
}

//-----------------------------------------------------------------------------------
//Función que calcula la media aritmética de un array y ajusta a dos decimales el resultado
//-----------------------------------------------------------------------------------

// array --> 
//f()
// --> R

//-----------------------------------------------------------------------------------

function calcularMedia(array) {

	var total = 0;
	array.forEach(function (valor) {
		total = total + valor;

	});
	var longitud = array.length;
	var media = total / longitud;
	return media.toFixed(2);

}

//-----------------------------------------------------------------------------------
//Función que al clickar sobre un marcador (sonda) del mapa pinta en cada botón de cada sensor la última medición registrada desde la BBDD
//-----------------------------------------------------------------------------------

//  --> tiposSensores: array(TEXT) email: TEXT, sonda:ENTERO 
// email y sonda son para el método de la api: valoresGet(email, sonda);
//f()
// --> 
//                  

//-----------------------------------------------------------------------------------	

function ultimosValores(tipoSensores, email, sonda) {

	tipoSensores.forEach(function (tipo) {

		valoresGet(tipo, email, sonda, function (valores) {
			var clase = "color" + tipo;
			var claseNivel = "nivel" + tipo;
			var arrayNiveles = document.getElementById("iconosSensoresUtimaMedicion").getElementsByClassName(claseNivel);
			var ultima = valores[valores.length - 1];
			mostrarNivel(arrayNiveles, ultima, tipo);
		});
	});
	calcularMedias(tipoSensores, email, sonda);

}

/*---------------------------------------------------------------------------------
Función recoge y devuelve las medias de las mediciones
-----------------------------------------------------------------------------------

--> array<TEXT>, email: TEXT, sonda: Z                                       
f()
--> obejto medias =>

medias = {
	Humedad: 0.0, 
	Salinidad: 0.0, 
	Temperatura: 0.0, 
	Iluminacion: 0.0
};
-----------------------------------------------------------------------------------	*/


function calcularMedias(tipoSensores, email, sonda) {
	var medias = {};

	tipoSensores.forEach(function (tipo) {
		var valoresSensores = [];
		valoresGet(tipo, email, sonda, function (valores) {

			valores.forEach(function (valor) {

				valoresSensores.push(valor[tipo.toLowerCase()]);
			});

			medias[tipo] = calcularMedia(valoresSensores);
		});


	});


	return medias;

}

/*---------------------------------------------------------------------------------
Función que calcula y devuelve las medias de todos las sondas de un cliente
-----------------------------------------------------------------------------------

--> array<TEXT>, email: TEXT                                      
f()
--> array<medias> => 

medias = [{
	Humedad: 0.0, 
	Salinidad: 0.0, 
	Temperatura: 0.0, 
	Iluminacion: 0.0
},
{
	Humedad: 0.0, 
	Salinidad: 0.0, 
	Temperatura: 0.0, 
	Iluminacion: 0.0
} 
];
-----------------------------------------------------------------------------------	*/

function calcularMediasSondas(tipoSensores, email) {
	tipoSensores = ["Humedad", "Salinidad", "Iluminacion", "Temperatura"];
	var numSondas;
	var listaMedias = [];

	sensoresGet(email, function (sondas) {
		numSondas = sondas.length;
	});
	var i;
	for (i = 1; i < 11; i++) {
		listaMedias[i] = calcularMedias(tipoSensores, email, i);

	}

	return listaMedias;

}

/*---------------------------------------------------------------------------------
=================================== EN PROCESO ====================================
Función que calcula si existe alguna alerta para mostrar al cliente 
-----------------------------------------------------------------------------------

--> array<medias>                        
f()
--> array<alerta> => 

alerta = {
	nivel: ALTO, 
	campo: 2, 
	sonda: 4,
	sensor: salinidad
};
-----------------------------------------------------------------------------------	*/

function hayAlertas(medias) {
	var alertas = [];
	var listaMedias = calcularMediasSondas(tipoSensores, email);
	var niveles = {
		humedad: 20,
		salinidad: 20,
		temperatura: 8,
		iluminacion: 300
	};

	tipoSensores.forEach(function (tipo) {
		for (i = 0; i < 8; i++) {
			valoresGet(tipo, email, i, function (valores) {
				valores.forEach(function (valor) {
					if (valor[tipo] > (listaMedias[i] + niveles[tipo.toLowerCase()]) || valor[tipo] < (listaMedias[i] - niveles[tipo.toLowerCase()])) {
						alertas.push({
							sensor: tipo,
							sonda: i,
							nivel: "ALTO",
							campo: 2

						});
					}


				});
			});
		}

	});

	return alertas;

}


/*---------------------------------------------------------------------------------
Función que muestra InfoWindow directamente en el sensor afectado al clicar sobre una alerta 
-----------------------------------------------------------------------------------

--> sonda: OBJETO
--> alerta: OBJETO

f()

-----------------------------------------------------------------------------------	*/
function crearMarcadorConAlerta(sonda, alerta) {
	var contentString =
		'<div id="contentInfo">' +
		'<div id="siteNotice">' +
		'</div>' +
		'<div id="headerZona"><div><h2 id="firstHeading" class="firstHeading">SONDA ' + sonda.ID_SONDA +
		'</h2></div>' /* <span id="bateria"><img src="./images/battery.png" alt="bateria"><span class="badge badge-danger">8%</span></span> */ + '</div>' +
		'<div id="bodyContent">' +
		'<p style="background:grey;text-align:center;padding:0.3rem 0;" class="text-light">Última medición hace 5 minutos <br /> (' + f.getDate() + "/" + (f.getMonth() + 1) + "/" + f.getFullYear() +
		" - " + f.getHours() + ":" + (f.getMinutes() - 5) + ":" + f.getSeconds() + ')</p>' +
		`<div style="padding-left:4rem;">

	<img width="50px" src="./images/sensores/` + alerta.sensor.toLowerCase() + `.svg" />
	<i style="color: ` + alerta.nivel + `;font-size:2rem;" class="fa fa-exclamation-triangle" ></i>
	<p style="display:inline;">` + alerta.msg + `</p>
	<button style="margin:.5rem 0rem;" class="btn btn-info" data-toggle="modal" data-target="#exampleModal">MAS INFORMACION</button>
	` +
		'</div>';

	var idSensor = tipoSensores.indexOf(alerta.sensor);
	var icono = document.getElementById("iconosSensores").getElementsByTagName('img')[idSensor];
	console.log(icono);

	var latLng = new google.maps.LatLng(sonda.LAT, sonda.LNG);
	var marker = new google.maps.Marker({
		position: latLng,
		map: mapa

	});
	if (infowindow) {
		infowindow.close();
	};
	infowindow.setContent(contentString);
	infowindow.open(mapa, marker);

	infowindow = new google.maps.InfoWindow({
		content: "loading...",
		//maxWidth: 900 //especifica el ancho máximo de la ventana de información en píxeles.
	});


	marker.addListener('click', function () {
		if (infowindow) {
			infowindow.close();
		};
		marker.setIcon(null);
		marker.setAnimation(null);

		infowindow.setContent(contentString);
		infowindow.open(mapa, marker);
	});


}

/*---------------------------------------------------------------------------------
Función que rellena la lista de alertas desde la BBDD
-----------------------------------------------------------------------------------

--> elemento: ELEMENTO HTML => elemento html dónde se verán las alertas
--> lista: ARRAY => lista de alertas                       
f()
--> 

-----------------------------------------------------------------------------------	*/
function rellenar(elemento, lista) {


	lista.forEach(function (datos) {
		elemento.innerHTML += ` <li>
		<a name="` + (datos.zona - 1) + `" id="` + datos.sonda + `" alerta="` + (datos.id - 1) + `" href="#" onclick="seleccionarZona(this)" class="dropdown-item">
		<i style="color:` + datos.nivel + `;float:left;padding-right:.9rem;"class="fa fa-exclamation-triangle" ></i> 
		Campo de ` + datos.zonaNombre + `
		<br/> ` + datos.sensor + `:  ` + datos.msg + ` <p style="font-size:12px;float:right;">03/05/2018 18:33</p> </a> 
		<i style="margin-top:.6rem;margin-right:.9rem;" class="fa fa-trash" data-toggle="modal" data-target="#borrarAlerta"></i>
		</li>`;
	});


}

/*---------------------------------------------------------------------------------
Función que coloca el cursos al final del texto de un input
-----------------------------------------------------------------------------------

--> Elemento HTML: input
--> Texto: TEXT

f()

-----------------------------------------------------------------------------------	*/

function cursoralFinal(input, texto) {
	input.value = texto;
	input.autofocus = true;
}

/*---------------------------------------------------------------------------------
Función que quita la clase .activo (background:lightgrey) al boton que la tenga cuando se pulsa en otro boton 
(BOTONES SENSORES PARTE SUPERIOR GRÁFICA)
-----------------------------------------------------------------------------------

--> Elemento HTML: input
--> Texto: TEXT

f()

-----------------------------------------------------------------------------------	*/

function setActivar(listabotones) {

	for (var i = 0; i < listabotones.length; i++) {
		if (listabotones[i].className = "active") {
			listabotones[i].className.remove = "active";
		}
	}
}

/*---------------------------------------------------------------------------------
Función un objeto Alerta de una sonda dada, si no existe alerta devuelve un objeto vacío
-----------------------------------------------------------------------------------

--> sonda: Objeto Sonda
--> alertas: Array<Alerta>

f()

--> alerta: Objeto Alerta

-----------------------------------------------------------------------------------	*/

function getAlerta(sonda, alertas) {
	var respuesta = {};

	alertas.forEach(function (alerta) {
		if (sonda.ID_SONDA == alerta.sonda) {
			respuesta = alerta;
		}
	});
	return respuesta;
};

/*---------------------------------------------------------------------------------
Función que coloca icono de alerta en la parte superior del sensor correspondiente
-----------------------------------------------------------------------------------

--> lista: Array<Elemento HTML<img>>
--> alerta: Objeto Alerta

f()

-----------------------------------------------------------------------------------	*/

function mostrarAlerta(lista, alerta) {

	for (var i = 0; i < lista.length; i++) {
		var sensor = lista[i].alt.split(" ")[1];
	if (alerta.sensor == sensor) {
			document.getElementById(sensor).innerHTML = `<i style="color:` + alerta.nivel + `;font-size:1.5rem" class="fa fa-exclamation-triangle" ></i>
			<div class="iconoLevelSensor"><img src="images/sensores/`+ sensor + `.svg" /></div>`;
		} 
	}
};


/*---------------------------------------------------------------------------------
Función que borra una zona mediante su id con el método de api.js zonaDelete
-----------------------------------------------------------------------------------

--> id: Z  ==> ID del a zona a eliminar

-----------------------------------------------------------------------------------	*/
function activarEliminar(id) {
	id = id + 1;
	console.log(id);
	var trozoURL = `?id=${id}`;
	zonaDelete(trozoURL, function (err, res) {
		if (err) {
			console.log(`Error: ${err}`);
			return;
		}
		console.log("Zona eliminada correctamente");
	});
}

/*---------------------------------------------------------------------------------
Función que muestra el nivel de la ultima medición de manera visual
-----------------------------------------------------------------------------------

--> arrayNiveles: array<div> 
lenght: 10
de 10% a 100%

-->nivel: Z valor de la última medición 
{ 75% }
--> tipo: TEXT nombre del sensor 
{ Temperatura, Iluminación... }
f()
-->
-----------------------------------------------------------------------------------	*/

function mostrarNivel(arrayNiveles, nivel, tipo) {
	var clase = "color" + tipo;
	nivel = nivel[tipo.toLowerCase()];
	if (tipo == "Temperatura") {
		nivel += 25;
	} else if (tipo == "Iluminacion") {
		nivel -= 6355;

	}

	if (nivel < 10) {
		arrayNiveles[10].classList.add(clase);
	} else if (nivel > 10 && nivel < 20) {
		arrayNiveles[9].classList.add(clase);
		arrayNiveles[8].classList.add(clase);
	} else if (nivel > 20 && nivel < 30) {
		arrayNiveles[9].classList.add(clase);
		arrayNiveles[8].classList.add(clase);
		arrayNiveles[7].classList.add(clase);
	} else if (nivel > 30 && nivel < 40) {
		arrayNiveles[9].classList.add(clase);
		arrayNiveles[8].classList.add(clase);
		arrayNiveles[7].classList.add(clase);
		arrayNiveles[6].classList.add(clase);
	} else if (nivel > 40 && nivel < 50) {
		arrayNiveles[9].classList.add(clase);
		arrayNiveles[8].classList.add(clase);
		arrayNiveles[7].classList.add(clase);
		arrayNiveles[6].classList.add(clase);
		arrayNiveles[5].classList.add(clase);
	} else if (nivel > 50 && nivel < 60) {
		arrayNiveles[9].classList.add(clase);
		arrayNiveles[8].classList.add(clase);
		arrayNiveles[7].classList.add(clase);
		arrayNiveles[6].classList.add(clase);
		arrayNiveles[5].classList.add(clase);
		arrayNiveles[4].classList.add(clase);
	} else if (nivel > 60 && nivel < 70) {
		arrayNiveles[9].classList.add(clase);
		arrayNiveles[8].classList.add(clase);
		arrayNiveles[7].classList.add(clase);
		arrayNiveles[6].classList.add(clase);
		arrayNiveles[5].classList.add(clase);
		arrayNiveles[4].classList.add(clase);
		arrayNiveles[3].classList.add(clase);
	} else if (nivel > 70 && nivel < 80) {
		arrayNiveles[9].classList.add(clase);
		arrayNiveles[8].classList.add(clase);
		arrayNiveles[7].classList.add(clase);
		arrayNiveles[6].classList.add(clase);
		arrayNiveles[5].classList.add(clase);
		arrayNiveles[4].classList.add(clase);
		arrayNiveles[3].classList.add(clase);
		arrayNiveles[2].classList.add(clase);
	} else if (nivel > 80 && nivel < 90) {
		arrayNiveles[9].classList.add(clase);
		arrayNiveles[8].classList.add(clase);
		arrayNiveles[7].classList.add(clase);
		arrayNiveles[6].classList.add(clase);
		arrayNiveles[5].classList.add(clase);
		arrayNiveles[4].classList.add(clase);
		arrayNiveles[3].classList.add(clase);
		arrayNiveles[2].classList.add(clase);
		arrayNiveles[1].classList.add(clase);
	} else if (nivel > 90) {
		arrayNiveles[9].classList.add(clase);
		arrayNiveles[8].classList.add(clase);
		arrayNiveles[7].classList.add(clase);
		arrayNiveles[6].classList.add(clase);
		arrayNiveles[5].classList.add(clase);
		arrayNiveles[4].classList.add(clase);
		arrayNiveles[3].classList.add(clase);
		arrayNiveles[2].classList.add(clase);
		arrayNiveles[1].classList.add(clase);
		arrayNiveles[0].classList.add(clase);
	}


}

/*---------------------------------------------------------------------------------
A Function to Get a Cookie
fuente => https://www.w3schools.com/js/js_cookies.asp
-----------------------------------------------------------------------------------

--> cname: TEXT  
COOKIE ==> {" --> EMAIL <-- = demo"} 
f() 
-->TEXT 
COOKE ==> {"email = --> DEMO <-- "}

-----------------------------------------------------------------------------------	*/
function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for (var i = 0; i < ca.length; i++) {
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


/*---------------------------------------------------------------------------------
Función que comprueba si un elemento está lleno y si es así, lo vacia
-----------------------------------------------------------------------------------
--> elemento: Elemento HTML a comprobar  
f() 
-->
-----------------------------------------------------------------------------------	*/

function vaciar(elemento) {

	if (elemento && elemento.innerHTML != "") {
		elemento.innerHTML = "";
	}

}