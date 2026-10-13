# GeoTracker Web (Monitoreo y Rastreo GPS en Tiempo Real)

Aplicación web 100% frontend (sin backend) conectada a **Firebase Realtime Database** (`geotracker-f2c25`) y **Google Maps JavaScript API**.

Inspirada y adaptada fielmente con la identidad visual y estilo minimalista de [phoschrome/APP-gps](https://github.com/phoschrome/APP-gps).

---

## Modos de Operación

1. **Modo Monitoreo (`monitoreo.html` / `index.html`):**
   - **Receptor pasivo:** NO solicita permisos de GPS ni emite coordenadas.
   - Escucha en tiempo real la ruta `/trackers/{deviceId}/current` en Firebase Realtime Database.
   - Dibuja la posición, trayectoria recorrida, radio de precisión y velocidad sobre Google Maps.
   - Auto-centrado dinámico, métricas en vivo (latitud, longitud, velocidad en km/h, precisión satelital, tiempo transcurrido desde el último paquete).

2. **Modo Rastreador (`rastreador.html`):**
   - **Emisor activo:** Captura las coordenadas de satélite mediante la API de Geolocalización (`watchPosition` de alta precisión).
   - Transmite los paquetes periódicamente a Firebase Realtime Database.
   - Presenta la posición propia en pantalla usando Google Maps.
   - Botón de control: "Iniciar seguimiento y transmisión" / "Detener seguimiento".
   - Al cerrar la pestaña o desconectarse, marca automáticamente el estado como `offline` en Firebase vía `onDisconnect`.

3. **Simulador de Pruebas (`simulador.html`):**
   - Permite simular un vehículo o persona en movimiento por rutas urbanas (Bogotá, Madrid, CDMX) enviando datos a Firebase cada 1.5 segundos.
   - Ideal para probar el visor de monitoreo sin tener que desplazarse físicamente.

---

## Estructura de Archivos

```
geotracker-web/
├── index.html              # Punto de entrada principal (redirige al panel de monitoreo)
├── monitoreo.html          # Vista de Monitoreo (Receptor en tiempo real)
├── rastreador.html         # Vista del Rastreador (Emisor GPS a Firebase)
├── simulador.html          # Generador de telemetría de prueba en movimiento
├── styles.css              # Hoja de estilos con la estética de APP-gps
├── firebase-service.js     # Conexión, lectura y escritura en Firebase Realtime Database
├── map-service.js          # Integración con Google Maps, marcadores y rutas
└── README.md               # Instrucciones de configuración
```

---

## Configuración de Firebase Realtime Database

1. Entra a tu consola de Firebase: [Consola de geotracker-f2c25](https://console.firebase.google.com/project/geotracker-f2c25/database/usage/current-billing/connections).
2. Ve a la pestaña **Reglas (Rules)** de Realtime Database.
3. Para pruebas o acceso directo desde la web sin backend ni login, asegúrate de permitir lectura y escritura:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
4. La URL de la base de datos predeterminada es:
   `https://geotracker-f2c25-default-rtdb.firebaseio.com`

---

## Configuración de Google Maps API

1. Accede a [Google Cloud Console](https://console.cloud.google.com/).
2. Asegúrate de habilitar la API **Maps JavaScript API**.
3. Copia tu **API Key** (`AIzaSy...`).
4. En cualquiera de las pantallas de la app, haz clic en el icono de **engranaje (⚙)** o en el botón **Configurar Google Maps** e introduce tu clave. Se guardará localmente en el navegador (`localStorage`).
5. También puedes pasar la clave por URL:
   `monitoreo.html?key=TU_API_KEY&device=dispositivo-01`

---

## Cómo Ejecutar Localmente

Como es una aplicación puramente frontend, puedes abrirla con cualquier servidor estático local:

```powershell
# Opción 1: Con Python
python -m http.server 8080 -d C:\Users\Andre\.gemini\antigravity\scratch\geotracker-web

# Opción 2: Con Node.js / npx
npx serve C:\Users\Andre\.gemini\antigravity\scratch\geotracker-web
```

Y abre en tu navegador:
`http://localhost:8080/monitoreo.html`
