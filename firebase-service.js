/**
 * geotracker-web: Configuración y Servicio Firebase Realtime Database
 * Compatible con Firebase v10 CDN (compat)
 */

const DEFAULT_CONFIG = {
  projectId: "geotracker-f2c25",
  databaseURL: "https://geotracker-f2c25-default-rtdb.firebaseio.com",
  apiKey: "", // Opcional si la base de datos permite lectura/escritura pública en pruebas
  deviceId: "dispositivo-01",
  googleMapsKey: ""
};

class GeoTrackerConfig {
  static getSettings() {
    const saved = localStorage.getItem("geotracker_settings");
    let config = { ...DEFAULT_CONFIG };
    if (saved) {
      try {
        config = { ...config, ...JSON.parse(saved) };
      } catch (e) {
        console.warn("Error leyendo configuración guardada:", e);
      }
    }
    // Permitir sobrescribir con parámetros de la URL (?device=camion1&key=AIzaSy...)
    const params = new URLSearchParams(window.location.search);
    if (params.get("device")) config.deviceId = params.get("device");
    if (params.get("mapsKey") || params.get("key")) config.googleMapsKey = params.get("mapsKey") || params.get("key");
    if (params.get("dbUrl")) config.databaseURL = params.get("dbUrl");
    return config;
  }

  static saveSettings(newConfig) {
    const current = GeoTrackerConfig.getSettings();
    const updated = { ...current, ...newConfig };
    localStorage.setItem("geotracker_settings", JSON.stringify(updated));
    return updated;
  }
}

class GeoTrackerFirebase {
  constructor() {
    this.app = null;
    this.database = null;
    this.isInitialized = false;
    this.currentListenerRef = null;
  }

  init() {
    const config = GeoTrackerConfig.getSettings();
    if (!window.firebase) {
      throw new Error("El SDK de Firebase no está cargado.");
    }

    if (firebase.apps.length > 0) {
      this.app = firebase.apps[0];
      this.database = firebase.database();
      this.isInitialized = true;
      return true;
    }

    const firebaseInitConfig = {
      projectId: config.projectId,
      databaseURL: config.databaseURL
    };
    if (config.apiKey) {
      firebaseInitConfig.apiKey = config.apiKey;
    }

    try {
      this.app = firebase.initializeApp(firebaseInitConfig);
      this.database = firebase.database();
      this.isInitialized = true;
      console.log("Firebase inicializado con éxito:", config.databaseURL);
      return true;
    } catch (err) {
      console.error("Error al inicializar Firebase:", err);
      throw err;
    }
  }

  /* ========================================================
     MODO RASTREADOR: Transmitir ubicación a Firebase
     ======================================================== */
  async updateTrackerLocation(deviceId, locationData) {
    if (!this.isInitialized) this.init();
    const trackerRef = this.database.ref(`trackers/${deviceId}/current`);
    const historyRef = this.database.ref(`trackers/${deviceId}/history`).push();

    const payload = {
      latitude: Number(locationData.latitude),
      longitude: Number(locationData.longitude),
      accuracy: Number(locationData.accuracy || 0),
      speed: locationData.speed !== null && !isNaN(locationData.speed) ? Number(locationData.speed) : 0,
      heading: locationData.heading !== null && !isNaN(locationData.heading) ? Number(locationData.heading) : 0,
      altitude: locationData.altitude !== null && !isNaN(locationData.altitude) ? Number(locationData.altitude) : null,
      timestamp: Date.now(),
      status: "online"
    };

    // Actualiza la posición actual
    await trackerRef.set(payload);

    // Opcionalmente guarda histórico para trazar rutas
    historyRef.set(payload).catch(e => console.warn("No se guardó el histórico:", e));

    // Si se pierde la conexión, marcar como desconectado
    trackerRef.child("status").onDisconnect().set("offline");
    trackerRef.child("lastSeen").onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);

    return payload;
  }

  async setTrackerOffline(deviceId) {
    if (!this.isInitialized) return;
    try {
      await this.database.ref(`trackers/${deviceId}/current/status`).set("offline");
      await this.database.ref(`trackers/${deviceId}/current/lastSeen`).set(Date.now());
    } catch (e) {
      console.warn("No se pudo marcar como offline:", e);
    }
  }

  /* ========================================================
     MODO MONITOREO: Escuchar en tiempo real sin emitir datos
     ======================================================== */
  subscribeToTracker(deviceId, onLocationChange, onError) {
    if (!this.isInitialized) this.init();

    // Detener suscripción anterior si existía
    this.unsubscribeFromTracker();

    this.currentListenerRef = this.database.ref(`trackers/${deviceId}/current`);
    console.log(`[Monitoreo] Suscrito a: trackers/${deviceId}/current`);

    this.currentListenerRef.on(
      "value",
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          onLocationChange(data);
        } else {
          onLocationChange(null);
        }
      },
      (error) => {
        console.error("[Monitoreo] Error al recibir datos de Firebase:", error);
        if (onError) onError(error);
      }
    );

    // Escuchar el estado de conectividad con Firebase
    const connectedRef = this.database.ref(".info/connected");
    connectedRef.on("value", (snap) => {
      const isConnected = snap.val() === true;
      console.log(`[Monitoreo] Conexión con servidor Firebase: ${isConnected ? 'En línea' : 'Desconectado'}`);
    });
  }

  unsubscribeFromTracker() {
    if (this.currentListenerRef) {
      this.currentListenerRef.off();
      this.currentListenerRef = null;
    }
  }
}

window.GeoTrackerConfig = GeoTrackerConfig;
window.geoTrackerFirebase = new GeoTrackerFirebase();
