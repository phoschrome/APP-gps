# GeoTracker - Emisor y Rastreador GPS en Tiempo Real

Aplicación web cliente (sin backend) para captura de geolocalización satelital y transmisión continua a **Firebase Realtime Database** (`geotracker-f2c25`), con visualización en **Google Maps**.

---

## Características
- **Captura GPS Satelital Nativa**: `navigator.geolocation.watchPosition` con filtros de precisión configurables (Alta precisión, Equilibrado, Estricto, Ahorro de energía).
- **Transmisión en tiempo real**: Envío de paquetes con latitud, longitud, velocidad, rumbo, altitud y precisión satelital.
- **Detección de desconexión**: Estado `offline` automático vía regla `onDisconnect` de Firebase.
- **Control de intervalo**: Frecuencia de muestreo configurable (desde 1 segundo).
- **Despliegue fácil**: Compatible con GitHub Pages (HTTPS requerido para permisos de geolocalización en smartphones).

---

## Configuración

1. **Google Maps API Key**:
   - Pulsa el icono de engranaje (⚙) o el botón en el mapa para ingresar tu API Key.
2. **ID del Dispositivo**:
   - Configura el nombre del canal/dispositivo (por ejemplo `dispositivo-01`, `camion-1`).
3. **Firebase Realtime Database**:
   - Base de datos conectada a `geotracker-f2c25`.
