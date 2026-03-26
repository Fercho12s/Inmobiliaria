import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
} from "remotion";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ListingData {
  title: string;
  price: number;
  currency: string;
  listingType: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaUnit: string;
  city: string;
  state: string;
  images: string[];
  agentName: string;
  agentPhone: string;
  agentEmail: string;
}

interface Props {
  listing: ListingData;
}

// ── Constantes ────────────────────────────────────────────────────────────────

export const PHOTO_FRAMES   = 90;   // 3 s a 30 fps
export const TRANSITION     = 15;   // 0.5 s
export const OUTRO_FRAMES   = 90;   // 3 s

export const defaultProps: Props = {
  listing: {
    title:        "Propiedad de ejemplo",
    price:        5_000_000,
    currency:     "MXN",
    listingType:  "venta",
    propertyType: "Casa",
    bedrooms:     3,
    bathrooms:    2,
    area:         200,
    areaUnit:     "m2",
    city:         "Ciudad de México",
    state:        "CDMX",
    images:       [],
    agentName:    "Agente Demo",
    agentPhone:   "55 1234 5678",
    agentEmail:   "agente@demo.com",
  },
};

export const calculateMetadata = ({ props }: { props: Props }) => {
  const count = Math.max(1, (props.listing.images || []).length);
  return { durationInFrames: count * PHOTO_FRAMES + OUTRO_FRAMES };
};

// ── Utilidades ────────────────────────────────────────────────────────────────

const fmt = (price: number, currency: string) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);

// ── Slide de foto con Ken Burns ───────────────────────────────────────────────

const PhotoSlide: React.FC<{ url: string }> = ({ url }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const scale   = interpolate(frame, [0, PHOTO_FRAMES + TRANSITION], [1.0, 1.12], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
        <Img
          src={url}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      {/* Degradado */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ── Overlay de texto principal (primer slide) ─────────────────────────────────

const MainOverlay: React.FC<{ listing: ListingData }> = ({ listing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slide = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 70 } });

  const badge = listing.listingType === "venta" ? "EN VENTA" : "EN RENTA";

  return (
    <AbsoluteFill
      style={{
        padding:        "80px 60px",
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "flex-end",
        fontFamily:     "sans-serif",
      }}
    >
      {/* Badge */}
      <div
        style={{
          alignSelf:      "flex-start",
          backgroundColor: "white",
          color:           "black",
          padding:         "10px 26px",
          fontSize:        28,
          fontWeight:      800,
          letterSpacing:   4,
          marginBottom:    28,
          opacity:         slide(4),
          transform:       `translateY(${(1 - slide(4)) * 40}px)`,
        }}
      >
        {badge}
      </div>

      {/* Precio */}
      <div
        style={{
          fontSize:     70,
          fontWeight:   900,
          color:        "white",
          lineHeight:   1.1,
          marginBottom: 14,
          opacity:      slide(9),
          transform:    `translateY(${(1 - slide(9)) * 40}px)`,
          textShadow:   "0 2px 24px rgba(0,0,0,0.6)",
        }}
      >
        {fmt(listing.price, listing.currency)}
      </div>

      {/* Ubicación */}
      <div
        style={{
          fontSize:     34,
          color:        "rgba(255,255,255,0.88)",
          marginBottom: 28,
          opacity:      slide(14),
          transform:    `translateY(${(1 - slide(14)) * 30}px)`,
        }}
      >
        {listing.city}, {listing.state}
      </div>

      {/* Stats */}
      <div
        style={{
          display:   "flex",
          gap:       40,
          opacity:   slide(18),
          transform: `translateY(${(1 - slide(18)) * 30}px)`,
        }}
      >
        {[
          { v: listing.bedrooms,  l: "Recámaras" },
          { v: listing.bathrooms, l: "Baños" },
          { v: `${listing.area}`, l: listing.areaUnit },
        ].map(({ v, l }, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 50, fontWeight: 800, color: "white" }}>{v}</div>
            <div style={{ fontSize: 20, color: "rgba(255,255,255,0.65)", letterSpacing: 2 }}>
              {l.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Slide de cierre ───────────────────────────────────────────────────────────

const OutroSlide: React.FC<{ listing: ListingData }> = ({ listing }) => {
  const frame   = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0B0B0F",
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        opacity,
        fontFamily:      "sans-serif",
        padding:         80,
      }}
    >
      <div
        style={{
          fontSize:      52,
          fontWeight:    900,
          color:         "white",
          letterSpacing: 10,
          marginBottom:  48,
        }}
      >
        VENDRIXA
      </div>

      <div style={{ width: 56, height: 2, backgroundColor: "white", marginBottom: 48 }} />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: "white", marginBottom: 14 }}>
          {listing.agentName}
        </div>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>
          {listing.agentPhone}
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.5)" }}>
          {listing.agentEmail}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Composición principal ─────────────────────────────────────────────────────

export const PropertyReel: React.FC<Props> = ({ listing }) => {
  const photos = (listing.images || []).slice(0, 6);
  const count  = Math.max(1, photos.length);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0B0F" }}>
      {/* Secuencias de fotos */}
      {(photos.length > 0 ? photos : [""]).map((url, i) => (
        <Sequence
          key={i}
          from={i * PHOTO_FRAMES}
          durationInFrames={PHOTO_FRAMES + TRANSITION}
        >
          {url ? (
            <PhotoSlide url={url} />
          ) : (
            <AbsoluteFill style={{ backgroundColor: "#111" }} />
          )}
          {i === 0 && <MainOverlay listing={listing} />}
        </Sequence>
      ))}

      {/* Cierre */}
      <Sequence from={count * PHOTO_FRAMES} durationInFrames={OUTRO_FRAMES}>
        <OutroSlide listing={listing} />
      </Sequence>
    </AbsoluteFill>
  );
};
