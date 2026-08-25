#!/usr/bin/env python3
"""
PixelSubs Pro Server v2.0.0
Plataforma Integral de Comparativa de Precios Regionales de Suscripciones Digitales y Calculadora de Ahorro.
Alojado en Google Pixel 6a Microserver.
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import os
import time
import datetime
import threading

PORT = 8098
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
SUBS_FILE = os.path.join(BASE_DIR, "subscriptions.json")

LAST_UPDATED = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")

# Tasas de cambio de divisas oficiales frente al EUR (con auto-actualizador en vivo)
EXCHANGE_RATES = {
    "EUR": 1.0,
    "USD": 0.92,
    "UAH": 0.022,    # Ucrania
    "KZT": 0.00185,  # Kazajistán
    "TRY": 0.027,    # Turquía
    "ARS": 0.00092,  # Argentina
    "CNY": 0.127,    # China
    "BRL": 0.165,    # Brasil
    "INR": 0.00895,  # India (1 EUR ≈ 111.7 INR)
    "GBP": 1.17,     # Reino Unido
    "PKR": 0.0033,   # Pakistán
    "NGN": 0.00061,  # Nigeria
    "EGP": 0.019,    # Egipto
    "PHP": 0.016,    # Filipinas
    "ZAR": 0.051,    # Sudáfrica (Rand)
    "JPY": 0.0062    # Japón (Yen)
}

def fetch_json(url):
    headers = {
        "User-Agent": "PixelSubsPro/2.0 (https://github.com/Taaz1234/pixel6a-microserver)",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=9) as resp:
            return json.loads(resp.read().decode("utf-8", errors="ignore"))
    except Exception as e:
        return None

def update_exchange_rates():
    """Actualiza tasas de cambio en vivo con soporte para proveedores duales."""
    global EXCHANGE_RATES, LAST_UPDATED
    providers = [
        "https://open.er-api.com/v6/latest/EUR",
        "https://api.exchangerate-api.com/v4/latest/EUR"
    ]
    
    for url in providers:
        try:
            data = fetch_json(url)
            if data and "rates" in data:
                rates = data["rates"]
                for curr in list(EXCHANGE_RATES.keys()):
                    if curr in rates and rates[curr] > 0:
                        EXCHANGE_RATES[curr] = round(1.0 / rates[curr], 6)
                LAST_UPDATED = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
                print(f"[+] Tasas de divisas en vivo actualizadas con éxito desde {url} ({LAST_UPDATED}).")
                return True
        except Exception as e:
            print(f"[!] Error con proveedor {url}: {e}")
    return False

def background_hourly_updater():
    """Hilo demonio que refresca las tasas automáticamente cada hora."""
    while True:
        time.sleep(3600)  # Cada 1 hora
        update_exchange_rates()

updater_thread = threading.Thread(target=background_hourly_updater, daemon=True)
updater_thread.start()
update_exchange_rates()

def load_subscriptions_data():
    if os.path.exists(SUBS_FILE):
        try:
            with open(SUBS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[!] Error leyendo {SUBS_FILE}: {e}")
    return []

def get_processed_subscriptions():
    raw_subs = load_subscriptions_data()
    results = []

    for sub in raw_subs:
        regional_list = []
        spain_price = sub.get("spain_price", 19.99)

        for p in sub.get("prices", []):
            rate = EXCHANGE_RATES.get(p.get("rate_key", "EUR"), 1.0)
            eur_price = round(p.get("amount", 0) * rate, 2)
            saved_eur = round(max(0, spain_price - eur_price), 2)
            saved_pct = int(round((saved_eur / spain_price) * 100)) if spain_price > 0 else 0

            regional_list.append({
                "region": p.get("region"),
                "flag": p.get("flag"),
                "currency": p.get("currency"),
                "local_amount": p.get("amount"),
                "eur_price": eur_price,
                "saved_eur": saved_eur,
                "saved_pct": saved_pct
            })

        # Ordenar de más barato a más caro
        regional_list.sort(key=lambda x: x["eur_price"])
        cheapest = regional_list[0] if regional_list else None
        yearly_saving = round(cheapest["saved_eur"] * 12, 2) if cheapest else 0
        spain_yearly = round(spain_price * 12, 2)
        cheapest_yearly = round((cheapest["eur_price"] * 12) if cheapest else 0, 2)

        results.append({
            "id": sub.get("id"),
            "name": sub.get("name"),
            "category": sub.get("category"),
            "icon": sub.get("icon"),
            "color": sub.get("color"),
            "image": sub.get("image"),
            "spain_price": spain_price,
            "spain_yearly": spain_yearly,
            "notes": sub.get("notes"),
            "cheapest_region": cheapest,
            "cheapest_yearly": cheapest_yearly,
            "yearly_saving": yearly_saving,
            "regional_prices": regional_list
        })

    return {
        "last_updated": LAST_UPDATED,
        "subscriptions": results
    }

class MainRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def translate_path(self, path):
        # Strip query strings and fragments cleanly
        clean_path = urllib.parse.urlparse(path).path
        return super().translate_path(clean_path)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/subscriptions":
            subs_data = get_processed_subscriptions()
            self.send_json(subs_data)

        elif path == "/api/subscriptions/refresh":
            update_exchange_rates()
            subs_data = get_processed_subscriptions()
            self.send_json(subs_data)

        elif path == "/api/rates":
            self.send_json({
                "last_updated": LAST_UPDATED,
                "rates": EXCHANGE_RATES
            })

        else:
            super().do_GET()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

if __name__ == "__main__":
    os.makedirs(STATIC_DIR, exist_ok=True)
    print(f"==================================================")
    print(f"💎 PixelSubs Pro v2.0 - Microserver Pixel 6a")
    print(f"📡 Escuchando en: http://0.0.0.0:{PORT}")
    print(f"💳 Comparador de Suscripciones & Calculadora de Ahorro")
    print(f"🔄 Auto-Actualizador Diario Activo ({LAST_UPDATED})")
    print(f"==================================================")
    
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), MainRequestHandler) as httpd:
        httpd.serve_forever()
