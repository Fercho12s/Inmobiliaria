import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_listing_content(listing) -> dict:
    amenidades = ", ".join(listing.amenities) if listing.amenities else "No especificadas"
    operacion = "venta" if listing.listingType == "venta" else "renta"

    prompt = f"""Eres un experto en marketing inmobiliario de lujo en México.
Genera contenido profesional y atractivo para la siguiente propiedad.

DATOS DE LA PROPIEDAD:
- Tipo: {listing.propertyType} en {operacion}
- Título: {listing.title}
- Precio: ${listing.price:,.0f} {listing.currency}
- Ubicación: {listing.address}, {listing.city}, {listing.state}
- Recámaras: {listing.bedrooms}
- Baños: {listing.bathrooms}
- Área construida: {listing.area} {listing.areaUnit}
- Amenidades: {amenidades}
- Notas del agente: {listing.description or "Sin notas adicionales"}

INSTRUCCIONES:
1. Escribe una descripción profesional y atractiva (3-4 párrafos, máximo 280 palabras).
   Usa un tono elegante pero cercano. Resalta la ubicación, los espacios y el estilo de vida.
2. Escribe un caption para Instagram con emojis, llamado a la acción y hashtags
   relevantes del sector inmobiliario en México (mínimo 15 hashtags).
3. Asigna un score de atracción del 1 al 100 basado en: ubicación, precio de mercado,
   amenidades y características generales.
4. Clasifica el precio como "bajo", "promedio" o "alto" para el mercado de {listing.city}.

Responde ÚNICAMENTE con un JSON válido con este formato exacto:
{{
  "description": "...",
  "instagram_caption": "...",
  "attractiveness_score": <número entero del 1 al 100>,
  "price_level": "<bajo|promedio|alto>"
}}"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    return json.loads(response.choices[0].message.content)
