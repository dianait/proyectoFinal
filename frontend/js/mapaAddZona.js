var poly;
var map;
var marker;
var inicial;
    function initMap() {
		//inicial = JSON.stringify(ubicacionActual());
		//console.log(inicial)
        map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 38.701789, lng: -0.48090980000000005},
        zoom: 17,
        disableDefaultUI: true,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        /* mapTypeId: google.maps.MapTypeId.SATELLITE, */
        // mapTypeId: 'satellite'
        streetViewControl: false
        });
		map.setMapTypeId('satellite');
		//map.setCenter(inicial)
        //mapa.setStreetViewContro('false');
        //Add a listener for the click event
    }

        /*Creación del poligono cogiendo el resultado de restar el este con el oeste, y el resultado de restar el norte con el sur*/
var zonaMapa; //variable que guarda la configuración de la zona
var poligono; // variable que guarda los vertices del poligono creado para la creación de la zona
    function ubicacionActual(){
	    //recoge la posición en lat y lng del dispositivo en tiempo real 
        navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
		};
		console.log(pos)
		//return pos;
        //console.log(pos)
    	map.setCenter(pos);
        });
	}
	//Ubicación de las sondas sin zona
	/*function ubicacionSonda(){

	}*/
    //Una vez recogida la ubicación actual del dispositivo, se crea un poligono
    function creacionPoligono(elemento){
           
        //función que te lleva a la ubicación del dispositivo
        //ubicacionActual();
        //función que te lleva a la sonda donde esta la zona que vas ha añadir
        //ubicacionSonda();

        //setTimeout, que después de 1 segundo crea un poligono en medio del mapa en la ubicación actual o del dispositivo o de una sonda seleccionada anteriormente
        setTimeout(function (){
            var pol = map.getBounds().toJSON();
        //console.log(pol)
        var ns = (pol.east - pol.west) / 3;
        var ew = (pol.north - pol.south) / 3;
        //console.log(ns)
        //console.log(ew)
        //Dar coordenadas a cada uno de los puntos
        pol.east -= ns;
        pol.west += ns;
        pol.north -= ew;
        pol.south += ew;
        //formación del poligono
        poligono = [
        {
            lat: pol.north,
            lng: pol.west
        },
        {
            lat: pol.north,
            lng: pol.east
        },
        {
            lat: pol.south,
            lng: pol.east
        },
        {
            lat: pol.south,
            lng: pol.west
        }
        ];
    	console.log(poligono)
    	//creación del elemento poligono
        zonaMapa = new google.maps.Polygon(
        {
            paths: poligono,
            strokeColor:'#FFFFFF',
            strokeOpacity: 0.8,
            strokeWeight:3,
            fillColor: '#FFFFFF',
            fillOpacity: 0.35,
            editable: true
        }
        );
        //visualización del elemento poligono
        zonaMapa.setMap(map);
        } ,1000)
            
    }
    /*Función que añada la nueva ZONA con un poligono sin SONDAS*/ 
    //futuras mejoras: añadir la SONDAS a la ZONA
    function guardarNuevaZona(elemento){
        //recogemos los valores del formulario
        var nombre = document.getElementById("inputNombre").value;
        //console.log(nombre)
        var color = document.getElementById("inputColor").value;
        //console.log(color)
        //console.log(id)
        color = color.split('#')[1];
        //console.log(color)
        /*if(vertices.length != 0){
            guardarVertices(id)
        }*/
        //parámetros para la petición a la api con los datos recogidos del formulario
        
        var trozoUrl = `?nombre=`+nombre+`&color=`+color;
        console.log(trozoUrl)

        zonaAdd(trozoUrl, function (res){
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