# 🌐 PixelSubs Pro v2.5

<p align="center">
  <img src="static/icons/google.svg" width="48" height="48" alt="Google" />
  <img src="static/icons/gamepass.svg" width="48" height="48" alt="Xbox" />
  <img src="static/icons/psplus.svg" width="48" height="48" alt="PlayStation" />
  <img src="static/icons/netflix.svg" width="48" height="48" alt="Netflix" />
  <img src="static/icons/spotify.svg" width="48" height="48" alt="Spotify" />
  <img src="static/icons/chatgpt.svg" width="48" height="48" alt="ChatGPT" />
</p>

<p align="center">
  <b>Comparador Global de Suscripciones Digitales & Herramienta de Ahorro Familiar</b><br>
  <i>Precios Oficiales 2026, Conversión en Vivo de 16 Divisas y Calculadora Interactiva de Cesta de Ahorro Anual</i>
</p>

---

## ✨ Características Principales

* 🎮 **21 Suscripciones Globales:**
  * **Videojuegos:** Xbox Game Pass Ultimate, PlayStation Plus Deluxe/Premium, Nintendo Switch Online Familiar + Expansión, GeForce NOW RTX 4080 Cloud, EA Play Pro.
  * **Cine & Streaming:** Netflix Premium 4K, Disney+ Premium 4K, Max / HBO Max, Amazon Prime Video, Apple TV+, Crunchyroll Mega Fan.
  * **Música & Audio:** YouTube Premium, Spotify Premium, Apple Music Lossless, TIDAL HiFi Plus FLAC.
  * **Inteligencia Artificial:** ChatGPT Plus (GPT-4o/Canvas), Claude Pro (Sonnet 3.5), Google One 2TB + Gemini Advanced, Canva Pro.
  * **Productividad & VPN:** Microsoft 365 Familiar (6 usuarios + 6TB), NordVPN Plus.

* 🌍 **Comparativa Internacional Rigurosa:**
  * Precios oficiales contrastados en moneda local para **España (EUR), India (INR), Turquía (TRY), Pakistán (PKR), Brasil (BRL), Sudáfrica (ZAR), Argentina (ARS), Japón (JPY), Egipto (EGP), Filipinas (PHP), Ucrania (UAH) y Nigeria (NGN)**.

* 💱 **Auto-Conversor de Divisas en Vivo:**
  * Backend en Python multi-hilo con actualización automática cada 6 horas frente a la API global de divisas `open.er-api.com`.

* 🧮 **Calculadora de Cesta de Ahorro Familiar:**
  * Permite seleccionar las suscripciones que utilizas día a día y calcular al instante tu **gasto anual en España vs. precio regional optimizado**, mostrando tu **ahorro total en euros (€) y porcentaje neto (%)**.

* 🎨 **Diseño Moderno & Logotipos Oficiales Vectoriales:**
  * Interfaz Cyberpunk Dark con insignias circulares que integran los logotipos vectoriales SVG oficiales de cada marca alojados de forma local (0 ms de latencia).

---

## 🚀 Inicio Rápido

### Requisitos
* Python 3.8+ (funciona sin dependencias externas obligatorias)

### Ejecución Local
```bash
# Clonar el repositorio
git clone https://github.com/Taaz1234/pixelsubs-pro.git
cd pixelsubs-pro

# Iniciar el servidor
python server.py
```
Abre en tu navegador: **`http://localhost:8098`**

---

## 🐳 Despliegue con Docker

```bash
docker build -t pixelsubs-pro .
docker run -d -p 8098:8098 --name pixelsubs pixelsubs-pro
```

---

## 📱 Despliegue en Android / Termux

```bash
pkg install python git
git clone https://github.com/Taaz1234/pixelsubs-pro.git
cd pixelsubs-pro
python server.py
```

---

## 📄 Licencia
Distribuido bajo la Licencia MIT. Desarrollado para optimización de presupuestos digitales.
