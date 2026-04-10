import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/types";
import { formatPrice } from "@/lib/utils";

delete (L.Icon.Default.prototype as any)._getIconUrl;

interface AllPropertiesMapProps {
  listings: Partial<Listing>[];
}

function makeCountIcon(count: number) {
  const size = count > 9 ? 44 : 36;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px; height:${size}px;
        background: linear-gradient(135deg, hsl(42,80%,55%), hsl(38,62%,38%));
        color: hsl(220,52%,8%);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 900; font-size: ${count > 9 ? '13' : '14'}px;
        font-family: 'Space Grotesk', sans-serif;
        border: 2.5px solid rgba(255,255,255,0.22);
        box-shadow: 0 4px 16px rgba(0,0,0,0.65), 0 0 0 6px rgba(185,150,50,0.10);
      ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

export default function AllPropertiesMap({ listings }: AllPropertiesMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || listings.length === 0) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([23.6345, -102.5528], 5);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false })
      .addAttribution('© <a href="https://carto.com" style="color:#555">CARTO</a>')
      .addTo(map);

    mapRef.current = map;

    const seen = new Set<string>();

    listings.forEach(async (listing) => {
      if (!listing.city) return;
      const key = `${listing.city}|${listing.state || ""}`;
      if (seen.has(key)) return;
      seen.add(key);

      try {
        const q = listing.state ? `${listing.city}, ${listing.state}` : listing.city;
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await r.json();
        if (!data?.length || !mapRef.current) return;

        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const cityListings = listings.filter((l) => l.city === listing.city);
        const count = cityListings.length;

        const popupHTML = `
          <div style="font-family:'Space Grotesk',sans-serif; min-width:180px; color:hsl(38,40%,88%);">
            <p style="font-weight:800;font-size:14px;margin:0 0 3px;">${listing.city}</p>
            <p style="font-size:11px;color:hsl(42,62%,52%);margin:0 0 10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">
              ${count} propiedad${count > 1 ? "es" : ""}
            </p>
            ${cityListings.slice(0, 3).map((l) => `
              <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:7px;margin-top:5px;">
                <p style="font-size:12px;font-weight:700;margin:0 0 2px;color:hsl(38,35%,82%);">${l.title || "Propiedad"}</p>
                <p style="font-size:11px;color:hsl(42,62%,52%);margin:0;font-weight:700;">${formatPrice(l.price, l.currency)}</p>
              </div>`).join("")}
            ${count > 3 ? `<p style="font-size:10px;color:#555;margin-top:8px;">+${count - 3} más</p>` : ""}
          </div>`;

        L.marker([lat, lon], { icon: makeCountIcon(count) })
          .addTo(mapRef.current!)
          .bindPopup(popupHTML, { closeButton: false, maxWidth: 220 });

      } catch {
        // skip
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
    <div className="mb-14">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-5 h-px bg-primary/60" />
        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Distribución Geográfica
        </h3>
      </div>
      <div
        ref={containerRef}
        className="w-full border border-white/8 overflow-hidden"
        style={{ height: 420 }}
      />
    </div>
  );
}
