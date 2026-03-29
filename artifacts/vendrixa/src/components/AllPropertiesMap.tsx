import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/types";
import { formatPrice } from "@/lib/utils";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface AllPropertiesMapProps {
  listings: Partial<Listing>[];
}

export default function AllPropertiesMap({ listings }: AllPropertiesMapProps) {
  const mapRef       = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || listings.length === 0) return;

    // Inicializar centrado en México
    const map = L.map(containerRef.current).setView([23.6345, -102.5528], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;

    // Geocodificar ciudades únicas y colocar marcadores
    const seen = new Set<string>();

    listings.forEach(async (listing) => {
      if (!listing.city) return;
      const key = `${listing.city},${listing.state || ""}`;
      if (seen.has(key)) return;
      seen.add(key);

      try {
        const query = listing.state ? `${listing.city}, ${listing.state}` : listing.city;
        const r     = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
        );
        const data = await r.json();
        if (!data?.length || !mapRef.current) return;

        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        // Contar propiedades en esta ciudad
        const cityListings = listings.filter(l => l.city === listing.city);
        const count        = cityListings.length;

        // Icono personalizado con contador
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background: hsl(42 62% 48%);
            color: hsl(220 52% 8%);
            width: 32px; height: 32px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 12px;
            border: 2px solid rgba(255,255,255,0.3);
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          ">${count}</div>`,
          iconSize:   [32, 32],
          iconAnchor: [16, 16],
        });

        const popupHTML = `
          <div style="font-family: sans-serif; min-width: 160px; padding: 4px;">
            <p style="font-weight:800; font-size:13px; margin:0 0 4px;">${listing.city}</p>
            <p style="font-size:11px; color:#888; margin:0 0 6px;">${count} propiedad${count > 1 ? "es" : ""}</p>
            ${cityListings.slice(0, 3).map(l =>
              `<div style="border-top:1px solid #eee; padding-top:4px; margin-top:4px;">
                <p style="font-size:11px; font-weight:600; margin:0;">${l.title || "Propiedad"}</p>
                <p style="font-size:11px; color:#B99632; margin:0;">${formatPrice(l.price, l.currency)}</p>
              </div>`
            ).join("")}
            ${count > 3 ? `<p style="font-size:10px;color:#aaa;margin-top:4px;">+${count - 3} más...</p>` : ""}
          </div>
        `;

        L.marker([lat, lon], { icon })
          .addTo(mapRef.current!)
          .bindPopup(popupHTML);

      } catch {
        // Geocodificación falló para esta ciudad — ignorar
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [listings]);

  return (
    <div className="mt-12 mb-12">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
        Mapa de Propiedades
      </h3>
      <div
        ref={containerRef}
        className="h-[380px] w-full border border-white/10 grayscale invert hue-rotate-180 brightness-90 contrast-125"
      />
    </div>
  );
}
