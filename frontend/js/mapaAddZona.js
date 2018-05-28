var mapa;


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
	//Función que cargue un vertice en la ubicación actual del dispositivo
	//cargarUbicacionActual()
}