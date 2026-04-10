import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
  city: string;
  address?: string;
}

const GOLD_MARKER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
  <defs>
    <radialGradient id="pg" cx="40%" cy="35%">
      <stop offset="0%" stop-color="hsl(42,80%,65%)"/>
      <stop offset="100%" stop-color="hsl(38,62%,38%)"/>
    </radialGradient>
    <filter id="ps">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.55)"/>
    </filter>
  </defs>
  <path d="M16 0C7.163 0 0 7.163 0 16c0 10.627 14 26 16 26s16-15.373 16-26C32 7.163 24.837 0 16 0z"
    fill="url(#pg)" filter="url(#ps)"/>
  <circle cx="16" cy="16" r="5" fill="hsl(220,52%,8%)" opacity="0.85"/>
</svg>`;

const goldIcon = L.divIcon({
  className: '',
  html: GOLD_MARKER_SVG,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -44],
});

export default function PropertyMap({ city, address }: PropertyMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      let lat = 19.4326;
      let lon = -99.1332;

      try {
        const q = address ? `${address}, ${city}` : city;
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data?.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      } catch {
        // fallback
      }

      if (!containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lon], 14);

      // CartoDB Dark Matter — no API key needed
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }
      ).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('© <a href="https://carto.com" style="color:#666">CARTO</a>')
        .addTo(map);

      L.marker([lat, lon], { icon: goldIcon }).addTo(map);
      mapRef.current = map;
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [city, address]);

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-5 h-px bg-primary/60" />
        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Ubicación
        </h3>
      </div>
      <div
        ref={containerRef}
        className="h-[320px] w-full border border-white/8 overflow-hidden"
      />
    </div>
  );
}
