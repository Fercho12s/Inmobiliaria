import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface ListingData {
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
  imageFiles: string[];   // nombres en publicDir: "slides/slide-0.jpg"
  agentName: string;
  agentPhone: string;
  agentEmail: string;
}

export interface Props {
  listing: ListingData;
  hasMusic: boolean;
  photoFrames: number;
  outroFrames: number;
  totalFrames: number;
}

// ── Constantes de diseño ───────────────────────────────────────────────────────

const GOLD     = "#C9A96E";
const DARK     = "#0B0B0F";
const FADE_IN  = 15;   // frames de fade‑in al inicio de cada slide
const FADE_OUT = 15;   // frames de fade‑out al final de cada slide

// ── Default props para preview en Remotion Studio ─────────────────────────────

export const defaultProps: Props = {
  listing: {
    title:        "Casa de lujo en venta",
    price:        450_000,
    currency:     "USD",
    listingType:  "venta",
    propertyType: "Casa",
    bedrooms:     4,
    bathrooms:    3,
    area:         320,
    areaUnit:     "m²",
    city:         "Santo Domingo",
    state:        "DN",
    images:       [],
    imageFiles:   [],
    agentName:    "Agente Vendrixa",
    agentPhone:   "+1 809-000-0000",
    agentEmail:   "agente@vendrixa.com",
  },
  hasMusic:    false,
  photoFrames: 120,
  outroFrames: 90,
  totalFrames: 210,
};

// ── Metadata dinámica (duración según número de fotos) ─────────────────────────

export const calculateMetadata = ({ props }: { props: Props }) => {
  const slides = Math.max(1, (props.listing.imageFiles || []).length);
  const total  = slides * (props.photoFrames || 120) + (props.outroFrames || 90);
  return { durationInFrames: total };
};

// ── Utilidad: formatear precio ─────────────────────────────────────────────────

function fmtPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-MX", {
      style:              "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
}

// ── Slide de foto individual ────────────────────────────────────────────────────

interface PhotoSlideProps {
  imageSrc:    string | null;   // staticFile URL o null
  listing:     ListingData;
  slideIndex:  number;
  totalSlides: number;
  duration:    number;          // duración total de este slide incl. FADE_OUT
}

const PhotoSlide: React.FC<PhotoSlideProps> = ({
  imageSrc, listing, slideIndex, totalSlides, duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Fade in / out ──────────────────────────────────────────────────────────
  const slideOpacity = interpolate(
    frame,
    [0, FADE_IN, duration - FADE_OUT, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Ken Burns: zoom lento + paneo alternado ────────────────────────────────
  const kenT = frame / duration;
  const scale = interpolate(kenT, [0, 1], [1.0, 1.10]);
  const panX  = slideIndex % 2 === 0
    ? interpolate(kenT, [0, 1], [0, -30])
    : interpolate(kenT, [0, 1], [0,  30]);
  const panY  = interpolate(kenT, [0, 1], [0, -18]);

  // ── Animaciones de texto (spring stagger) ─────────────────────────────────
  const mkSpring = (delay: number) =>
    spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 20, stiffness: 80 } });

  const s0 = mkSpring(2);   // brand / dots
  const s1 = mkSpring(8);   // badges
  const s2 = mkSpring(14);  // precio
  const s3 = mkSpring(20);  // ciudad
  const s4 = mkSpring(26);  // stats

  const ty = (s: number) => `translateY(${(1 - s) * 50}px)`;

  const badge = listing.listingType?.toLowerCase() === "venta" ? "EN VENTA" : "EN RENTA";
  const price = fmtPrice(listing.price, listing.currency);

  return (
    <AbsoluteFill style={{ opacity: slideOpacity }}>

      {/* ── Foto con Ken Burns ───────────────────────────────────────────── */}
      <AbsoluteFill style={{
        transform:       `scale(${scale}) translate(${panX}px, ${panY}px)`,
        transformOrigin: "center center",
        overflow:        "hidden",
      }}>
        {imageSrc ? (
          <Img
            src={imageSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <AbsoluteFill style={{
            background: "linear-gradient(135deg, #1a1208 0%, #2a1e0a 50%, #0f0f0f 100%)",
          }} />
        )}
      </AbsoluteFill>

      {/* ── Gradientes superpuestos ──────────────────────────────────────── */}
      <AbsoluteFill style={{
        background: [
          "linear-gradient(to bottom,",
          "  rgba(0,0,0,0.55) 0%,",
          "  transparent 28%,",
          "  transparent 42%,",
          "  rgba(0,0,0,0.90) 72%,",
          "  rgba(0,0,0,0.97) 100%)",
        ].join(""),
      }} />

      {/* ── Barra superior: brand + indicadores ─────────────────────────── */}
      <div style={{
        position:        "absolute",
        top:             80,
        left:            60,
        right:           60,
        display:         "flex",
        justifyContent:  "space-between",
        alignItems:      "center",
        opacity:         s0,
        transform:       ty(s0),
      }}>
        {/* Logo */}
        <div style={{
          fontFamily:    "sans-serif",
          fontSize:      38,
          fontWeight:    800,
          color:         GOLD,
          letterSpacing: 7,
        }}>
          VENDRIXA
        </div>

        {/* Dots */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div key={i} style={{
              width:        i === slideIndex ? 34 : 10,
              height:       10,
              borderRadius: 5,
              background:   i === slideIndex ? GOLD : "rgba(255,255,255,0.35)",
            }} />
          ))}
        </div>
      </div>

      {/* ── Bloque inferior ─────────────────────────────────────────────── */}
      <div style={{
        position:  "absolute",
        bottom:    0,
        left:      0,
        right:     0,
        padding:   "0 60px 90px",
      }}>

        {/* Badges */}
        <div style={{
          display:      "flex",
          gap:          16,
          marginBottom: 30,
          opacity:      s1,
          transform:    ty(s1),
        }}>
          <span style={{
            background:    GOLD,
            color:         "#000",
            fontFamily:    "sans-serif",
            fontWeight:    800,
            fontSize:      26,
            letterSpacing: 4,
            padding:       "10px 30px",
            textTransform: "uppercase",
          }}>
            {badge}
          </span>
          <span style={{
            background:    "rgba(255,255,255,0.12)",
            border:        "1px solid rgba(255,255,255,0.30)",
            color:         "#fff",
            fontFamily:    "sans-serif",
            fontWeight:    700,
            fontSize:      26,
            letterSpacing: 4,
            padding:       "10px 30px",
            textTransform: "uppercase",
          }}>
            {listing.propertyType}
          </span>
        </div>

        {/* Precio */}
        <div style={{
          fontFamily:    "sans-serif",
          fontSize:      86,
          fontWeight:    900,
          color:         "#fff",
          lineHeight:    1,
          marginBottom:  18,
          textShadow:    "0 4px 24px rgba(0,0,0,0.8)",
          opacity:       s2,
          transform:     ty(s2),
        }}>
          {price}
        </div>

        {/* Ciudad */}
        <div style={{
          fontFamily:    "sans-serif",
          fontSize:      34,
          fontWeight:    300,
          color:         "rgba(255,255,255,0.78)",
          letterSpacing: 1,
          marginBottom:  42,
          opacity:       s3,
          transform:     ty(s3),
        }}>
          {listing.city}
          {listing.state && listing.state !== listing.city ? `, ${listing.state}` : ""}
        </div>

        {/* Stats row */}
        <div style={{
          display:      "flex",
          borderTop:    `2px solid ${GOLD}`,
          paddingTop:   28,
          opacity:      s4,
          transform:    ty(s4),
        }}>
          {[
            { v: String(listing.bedrooms  || 0), l: "RECÁM."              },
            { v: String(listing.bathrooms || 0), l: "BAÑOS"               },
            { v: String(listing.area      || 0), l: (listing.areaUnit || "M²").toUpperCase() },
          ].map(({ v, l }, i, arr) => (
            <div key={i} style={{
              flex:          1,
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              borderRight:   i < arr.length - 1 ? "1px solid rgba(255,255,255,0.18)" : "none",
            }}>
              <span style={{
                fontFamily: "sans-serif",
                fontSize:   54,
                fontWeight: 800,
                color:      "#fff",
                lineHeight: 1.1,
              }}>{v}</span>
              <span style={{
                fontFamily:    "sans-serif",
                fontSize:      22,
                fontWeight:    700,
                color:         GOLD,
                letterSpacing: 3,
                marginTop:     6,
              }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Slide de contacto (outro) ──────────────────────────────────────────────────

const OutroSlide: React.FC<{ listing: ListingData; duration: number }> = ({ listing, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [duration - 15, duration], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  const mkSpring = (delay: number) =>
    spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 18, stiffness: 70 } });

  const s0 = mkSpring(0);
  const s1 = mkSpring(8);
  const s2 = mkSpring(16);
  const s3 = mkSpring(24);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, #1a1208 0%, ${DARK} 65%)`,
      display:         "flex",
      flexDirection:   "column",
      alignItems:      "center",
      justifyContent:  "center",
      fontFamily:      "sans-serif",
      padding:         "80px 100px",
      opacity,
    }}>

      {/* Línea dorada superior */}
      <div style={{
        width:           interpolate(s0, [0, 1], [0, 100]),
        height:          3,
        background:      GOLD,
        marginBottom:    60,
      }} />

      {/* Encabezado */}
      <div style={{
        fontSize:      38,
        fontWeight:    300,
        color:         "rgba(255,255,255,0.55)",
        letterSpacing: 8,
        textTransform: "uppercase",
        marginBottom:  30,
        opacity:       s1,
        transform:     `translateY(${(1 - s1) * 60}px)`,
      }}>
        CONTACTA AL AGENTE
      </div>

      {/* Nombre del agente */}
      <div style={{
        fontSize:      70,
        fontWeight:    800,
        color:         "#fff",
        textAlign:     "center",
        letterSpacing: 2,
        marginBottom:  50,
        lineHeight:    1.1,
        opacity:       s1,
        transform:     `translateY(${(1 - s1) * 60}px)`,
      }}>
        {listing.agentName}
      </div>

      {/* Separador */}
      <div style={{
        width:        "55%",
        height:       1,
        background:   `rgba(201, 169, 110, 0.35)`,
        marginBottom: 50,
      }} />

      {/* Teléfono */}
      {listing.agentPhone && (
        <div style={{
          fontSize:      50,
          fontWeight:    600,
          color:         GOLD,
          letterSpacing: 2,
          marginBottom:  20,
          opacity:       s2,
          transform:     `translateY(${(1 - s2) * 40}px)`,
        }}>
          {listing.agentPhone}
        </div>
      )}

      {/* Email */}
      {listing.agentEmail && (
        <div style={{
          fontSize:      34,
          fontWeight:    300,
          color:         "rgba(255,255,255,0.55)",
          letterSpacing: 1,
          marginBottom:  0,
          opacity:       s3,
          transform:     `translateY(${(1 - s3) * 40}px)`,
        }}>
          {listing.agentEmail}
        </div>
      )}

      {/* Brand footer */}
      <div style={{
        position:      "absolute",
        bottom:        90,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           10,
        opacity:       s3,
      }}>
        <div style={{
          fontSize:      46,
          fontWeight:    800,
          color:         GOLD,
          letterSpacing: 8,
        }}>
          VENDRIXA
        </div>
        <div style={{
          fontSize:      20,
          fontWeight:    300,
          color:         "rgba(255,255,255,0.28)",
          letterSpacing: 5,
          textTransform: "uppercase",
        }}>
          Real Estate Studio
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Composición principal ──────────────────────────────────────────────────────

export const PropertyReel: React.FC<Props> = ({
  listing, hasMusic, photoFrames, outroFrames,
}) => {
  const PHOTO_F  = photoFrames || 120;
  const OUTRO_F  = outroFrames || 90;
  const XFADE    = FADE_OUT;  // superposición de fade para cross‑fade suave

  const slides = (listing.imageFiles || []).length > 0
    ? listing.imageFiles
    : [null as unknown as string];  // al menos un slide oscuro si no hay fotos

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>

      {/* ── Música de fondo ─────────────────────────────────────────────── */}
      {hasMusic && (
        <Audio
          src={staticFile("music/background.mp3")}
          volume={0.25}
          startFrom={0}
        />
      )}

      {/* ── Slides de fotos (con cross‑fade solapado) ───────────────────── */}
      {slides.map((imgFile, i) => (
        <Sequence
          key={i}
          from={i * PHOTO_F}
          durationInFrames={PHOTO_F + XFADE}  // el XFADE extra permite el solapamiento
        >
          <PhotoSlide
            imageSrc={imgFile ? staticFile(imgFile) : null}
            listing={listing}
            slideIndex={i}
            totalSlides={slides.length}
            duration={PHOTO_F + XFADE}
          />
        </Sequence>
      ))}

      {/* ── Slide de contacto (outro) ────────────────────────────────────── */}
      <Sequence from={slides.length * PHOTO_F} durationInFrames={OUTRO_F}>
        <OutroSlide listing={listing} duration={OUTRO_F} />
      </Sequence>

    </AbsoluteFill>
  );
};
