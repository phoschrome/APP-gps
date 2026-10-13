/**
 * geotracker-web: Controlador de Google Maps
 * Gestiona la carga dinámica, marcadores, círculo de precisión, polilínea de ruta y estilos
 */

const EMERALD_MAP_STYLE = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#2c403b" }]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#ffffff" }, { "weight": 2.5 }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{ "color": "#f2f6f4" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5eee9" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#d9ebe1" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dceae2" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{ "color": "#f4faf7" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c6e3d7" }]
  }
];

class GeoTrackerMap {
  constructor(containerId = "map") {
    this.containerId = containerId;
    this.map = null;
    this.marker = null;
    this.accuracyCircle = null;
    this.routePolyline = null;
    this.infoWindow = null;
    this.pathCoordinates = [];
    this.isAutoCenter = true;
    this.isLoaded = false;
  }

  static loadScript(apiKey) {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        return resolve(window.google.maps);
      }
      if (!apiKey || apiKey.trim() === "") {
        return reject(new Error("No se proporcionó una clave de API de Google Maps."));
      }

      // Comprobar si ya existe una etiqueta de script
      const existingScript = document.getElementById("google-maps-sdk");
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.id = "google-maps-sdk";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error("Google Maps no se cargó correctamente."));
        }
      };
      script.onerror = () => {
        reject(new Error("Error de conexión al cargar Google Maps. Verifica tu clave de API."));
      };
      document.head.appendChild(script);
    });
  }

  initMap(center = { lat: 4.60971, lng: -74.08175 }, zoom = 16) {
    const mapElement = document.getElementById(this.containerId);
    if (!mapElement) {
      console.error("Contenedor de mapa no encontrado:", this.containerId);
      return;
    }

    this.map = new google.maps.Map(mapElement, {
      center: center,
      zoom: zoom,
      styles: EMERALD_MAP_STYLE,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: "greedy"
    });

    // Crear polilínea para la ruta recorrida
    this.routePolyline = new google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: "#187b68",
      strokeOpacity: 0.85,
      strokeWeight: 4,
      map: this.map
    });

    // Crear círculo de precisión GPS
    this.accuracyCircle = new google.maps.Circle({
      strokeColor: "#187b68",
      strokeOpacity: 0.35,
      strokeWeight: 1.5,
      fillColor: "#39a47e",
      fillOpacity: 0.15,
      map: this.map,
      center: center,
      radius: 0
    });

    // Icono SVG personalizado de estilo esmeralda
    const markerIcon = {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      fillColor: "#187b68",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#ffffff",
      scale: 1.8,
      anchor: new google.maps.Point(12, 22)
    };

    this.marker = new google.maps.Marker({
      position: center,
      map: this.map,
      icon: markerIcon,
      title: "Ubicación en tiempo real",
      animation: google.maps.Animation.DROP
    });

    this.infoWindow = new google.maps.InfoWindow();
    this.marker.addListener("click", () => {
      this.openInfoWindow();
    });

    this.isLoaded = true;
    console.log("Google Maps inicializado exitosamente.");
  }

  updatePosition(lat, lng, accuracy = 0, speed = 0, timestamp = null) {
    if (!this.map || !this.marker) return;

    const newPos = new google.maps.LatLng(lat, lng);

    // Actualizar marcador
    this.marker.setPosition(newPos);

    // Actualizar radio de precisión
    if (this.accuracyCircle) {
      this.accuracyCircle.setCenter(newPos);
      this.accuracyCircle.setRadius(accuracy || 0);
    }

    // Agregar a la ruta recorrida
    this.pathCoordinates.push(newPos);
    if (this.routePolyline) {
      this.routePolyline.setPath(this.pathCoordinates);
    }

    // Si auto-center está habilitado, centrar mapa
    if (this.isAutoCenter) {
      this.map.panTo(newPos);
    }

    // Guardar última posición para InfoWindow
    this.lastPositionData = { lat, lng, accuracy, speed, timestamp: timestamp || Date.now() };
  }

  openInfoWindow() {
    if (!this.lastPositionData || !this.infoWindow || !this.marker) return;
    const { lat, lng, accuracy, speed, timestamp } = this.lastPositionData;
    const timeStr = new Date(timestamp).toLocaleTimeString();
    const speedKmH = speed ? (speed * 3.6).toFixed(1) : "0.0";

    const contentString = `
      <div style="font-family: Inter, system-ui, sans-serif; padding: 4px 6px; font-size: 12px; color: #172d2b;">
        <div style="font-weight: 700; color: #187b68; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#39a47e;"></span>
          Rastreo Satelital Activo
        </div>
        <p style="margin: 2px 0;"><strong>Latitud:</strong> ${lat.toFixed(6)}</p>
        <p style="margin: 2px 0;"><strong>Longitud:</strong> ${lng.toFixed(6)}</p>
        <p style="margin: 2px 0;"><strong>Velocidad:</strong> ${speedKmH} km/h</p>
        <p style="margin: 2px 0;"><strong>Precisión:</strong> ±${Math.round(accuracy)} m</p>
        <p style="margin: 4px 0 0; color: #687874; font-size: 11px;"><strong>Actualizado:</strong> ${timeStr}</p>
      </div>
    `;

    this.infoWindow.setContent(contentString);
    this.infoWindow.open(this.map, this.marker);
  }

  centerOnMarker() {
    if (this.map && this.marker && this.marker.getPosition()) {
      this.map.panTo(this.marker.getPosition());
      if (this.map.getZoom() < 15) {
        this.map.setZoom(16);
      }
    }
  }

  clearRoute() {
    this.pathCoordinates = [];
    if (this.routePolyline) {
      this.routePolyline.setPath([]);
    }
  }

  toggleAutoCenter(enable) {
    this.isAutoCenter = enable !== undefined ? enable : !this.isAutoCenter;
    return this.isAutoCenter;
  }
}

window.GeoTrackerMap = GeoTrackerMap;
