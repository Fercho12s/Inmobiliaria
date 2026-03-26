"""
seed_remax.py — Importa propiedades_remax_limpio.csv al backend via POST /api/listings
Uso: python seed_remax.py [ruta_csv]
"""
import csv
import re
import sys
import json
import urllib.request
import urllib.error

API_URL = "http://localhost:8000/api/listings"
CSV_PATH = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\secre\OneDrive\Documents\6to informatica\pasantia\propiedades_remax_limpio.csv"


def parse_price(raw: str):
    """'US$460,000' -> (460000.0, 'USD')  |  'RD$12,500,000' -> (12500000.0, 'DOP')"""
    raw = raw.strip().upper()
    currency = "USD" if "US$" in raw else "DOP"
    # quita prefijos y símbolo de moneda
    raw = re.sub(r"DESDE\s*", "", raw)
    raw = re.sub(r"(US|RD)\$", "", raw)
    raw = raw.replace(",", "").replace(".", "").strip()
    try:
        # reconstruye decimales: si el original tenía un punto lo mantenemos
        original_clean = re.sub(r"DESDE\s*", "", sys.argv[0] if False else "")
        price = float(raw) if raw else 0.0
    except ValueError:
        price = 0.0
    return price, currency


def parse_price_v2(raw: str):
    raw_upper = raw.strip().upper()
    currency = "USD" if "US$" in raw_upper else "DOP"
    # elimina "DESDE"
    cleaned = re.sub(r"DESDE\s*", "", raw_upper)
    # elimina símbolo de moneda
    cleaned = re.sub(r"(US|RD)\$", "", cleaned)
    # elimina comas (separador de miles) pero preserva el punto decimal
    cleaned = cleaned.replace(",", "").strip()
    try:
        price = float(cleaned)
    except ValueError:
        price = 0.0
    return price, currency


def parse_area(raw: str):
    """'225.00 M2' -> 225.0"""
    m = re.search(r"[\d.]+", raw.strip())
    return float(m.group()) if m else 0.0


def parse_location(raw: str):
    """'LOS CACICAZGOS, SANTO DOMINGO DE GUZMÁN' -> (address, city, state)"""
    parts = raw.split(",", 1)
    address = parts[0].strip()
    city = parts[1].strip() if len(parts) > 1 else address
    state = city  # usamos city como state también
    return address, city, state


def post_listing(data: dict):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status


def main():
    ok = 0
    errors = 0

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    total = len(rows)
    print(f"Importando {total} propiedades...")

    for i, row in enumerate(rows, 1):
        try:
            price, currency = parse_price_v2(row["Precio"])
            area = parse_area(row["Metros Cuadrados"])
            address, city, state = parse_location(row["Ubicación"])

            bedrooms_raw = row["Recámaras"].strip()
            bedrooms = int(bedrooms_raw) if bedrooms_raw.isdigit() else 0

            bathrooms_raw = row["Baños"].strip()
            try:
                bathrooms = float(bathrooms_raw)
            except ValueError:
                bathrooms = 0.0

            image_url = row["Link Imagen"].strip()
            source_url = row["URL"].strip()

            payload = {
                "title": row["Nombre"].strip(),
                "propertyType": row["Tipo"].strip(),
                "listingType": "sale",
                "address": address,
                "city": city,
                "state": state,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "area": area if area > 0 else 1.0,
                "areaUnit": "m2",
                "price": price if price > 0 else 1.0,
                "currency": currency,
                "description": f"Fuente: {source_url}",
                "amenities": [],
                "images": [image_url] if image_url else [],
                "agentName": "RE/MAX RD",
                "agentPhone": "N/A",
                "agentEmail": "info@remaxrd.com",
            }

            status = post_listing(payload)
            ok += 1
            if i % 50 == 0:
                print(f"  [{i}/{total}] {ok} ok, {errors} errores")

        except urllib.error.HTTPError as e:
            errors += 1
            print(f"  [{i}] HTTP {e.code} — {row.get('Nombre', '?')}")
        except Exception as e:
            errors += 1
            print(f"  [{i}] ERROR — {row.get('Nombre', '?')}: {e}")

    print(f"\nListo: {ok} importadas, {errors} errores.")


if __name__ == "__main__":
    main()
