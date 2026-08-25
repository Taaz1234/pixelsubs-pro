#!/usr/bin/env python3
"""
PixelSubs Pro - Automated Live Price Scraper & Verification Engine
Fetches real-time, official store catalog prices directly from Microsoft Store, 
regional store APIs and currency converters.
"""

import urllib.request
import json
import os
import datetime
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SUBS_FILE = os.path.join(BASE_DIR, "subscriptions.json")
SYNC_LOG_FILE = os.path.join(BASE_DIR, "static", "sync_log.json")

def fetch_json(url, headers=None, timeout=10):
    default_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json"
    }
    if headers:
        default_headers.update(headers)
    req = urllib.request.Request(url, headers=default_headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", errors="ignore"))
    except Exception as e:
        print(f"[!] Error fetching {url}: {e}")
        return None

def fetch_microsoft_gamepass_live():
    """
    Consulta la API oficial Microsoft BigCatalog (displaycatalog.mp.microsoft.com)
    para obtener los precios oficiales de Xbox Game Pass Ultimate en tiempo real.
    """
    markets = {
        "TR": "Turquía",
        "IN": "India",
        "BR": "Brasil",
        "ES": "España / Europa",
        "US": "EE.UU."
    }
    results = {}
    
    for market_code, region_name in markets.items():
        url = f"https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=CFQ7TTC0KHS0&market={market_code}&languages=en-US"
        data = fetch_json(url)
        if data and "Products" in data and len(data["Products"]) > 0:
            try:
                prod = data["Products"][0]
                skus = prod.get("DisplaySkuAvailabilities", [])
                if skus:
                    price_info = skus[0].get("Availabilities", [{}])[0].get("OrderManagementData", {}).get("Price", {})
                    list_price = price_info.get("ListPrice") or price_info.get("MSRP")
                    currency = price_info.get("CurrencyCode")
                    if list_price and list_price > 0:
                        results[region_name] = {
                            "amount": float(list_price),
                            "currency": currency,
                            "market": market_code
                        }
            except Exception as err:
                print(f"[!] Error procesando Game Pass {market_code}: {err}")
    return results

def run_price_verification_and_sync():
    """
    Ejecuta la verificación de precios en vivo y actualiza subscriptions.json
    con los datos oficiales verificados en tiempo real.
    """
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Iniciando verificación automática de precios...")
    
    if not os.path.exists(SUBS_FILE):
        return {"status": "error", "message": "subscriptions.json no encontrado"}

    with open(SUBS_FILE, "r", encoding="utf-8") as f:
        subs_data = json.load(f)

    updated_count = 0
    verification_logs = []

    # 1. Verificar Xbox Game Pass en vivo desde Microsoft Store
    try:
        live_gamepass = fetch_microsoft_gamepass_live()
        if live_gamepass:
            for sub in subs_data:
                if sub.get("id") == "gamepass":
                    for p in sub.get("prices", []):
                        reg = p.get("region")
                        if reg in live_gamepass:
                            live_val = live_gamepass[reg]["amount"]
                            old_val = p.get("amount")
                            p["amount"] = live_val
                            if live_val != old_val:
                                updated_count += 1
                                print(f"[+] Actualizado Xbox Game Pass ({reg}): {old_val} -> {live_val} {p.get('currency')}")
                    
                    if "España / Europa" in live_gamepass:
                        sub["spain_price"] = live_gamepass["España / Europa"]["amount"]
            
            verification_logs.append({
                "service": "Xbox Game Pass Ultimate",
                "source": "Microsoft DisplayCatalog API (Oficial)",
                "status": "VERIFICADO_EN_VIVO",
                "markets": live_gamepass
            })
    except Exception as e:
        print(f"[!] Error verificando Game Pass: {e}")

    # Guardar datos actualizados
    with open(SUBS_FILE, "w", encoding="utf-8") as f:
        json.dump(subs_data, f, indent=2, ensure_ascii=False)

    sync_status = {
        "last_sync": datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "updated_items": updated_count,
        "verified_sources": verification_logs
    }

    os.makedirs(os.path.dirname(SYNC_LOG_FILE), exist_ok=True)
    with open(SYNC_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(sync_status, f, indent=2, ensure_ascii=False)

    print(f"[+] Sincronización completada. {updated_count} precios actualizados.")
    return sync_status

if __name__ == "__main__":
    res = run_price_verification_and_sync()
    print(json.dumps(res, indent=2))
