import { useEffect, useRef, useMemo, useState } from "react";

/* ── Tipos internos ── */
interface Drop {
  x: number; y: number;
  speed: number; len: number;
  opacity: number; width: number;
}
interface Blob { left: number; top: number; size: number; delay: number; duration: number; }

/* ── Constantes ── */
const ANGLE  = 15 * Math.PI / 180; // inclinación lluvia
const SX     = Math.sin(ANGLE);     // componente X
const SY     = Math.cos(ANGLE);     // componente Y
const N_DROPS = 240;
const N_BLOBS = 30;

export default function RainEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const [flash, setFlash] = useState(false);

  /* ── Gotitas en el vidrio (CSS) ── */
  const blobs = useMemo<Blob[]>(() =>
    Array.from({ length: N_BLOBS }, () => ({
      left:     Math.random() * 95,
      top:      Math.random() * 50,
      size:     3 + Math.random() * 9,
      delay:    Math.random() * 6,
      duration: 4 + Math.random() * 7,
    }))
  , []);

  /* ── Canvas: lluvia principal ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width  = width  || window.innerWidth;
      canvas.height = height || window.innerHeight;
    };
    resize();

    const W = () => canvas.width;
    const H = () => canvas.height;

    /* Crear gotas con posiciones iniciales dispersas */
    const drops: Drop[] = Array.from({ length: N_DROPS }, () => ({
      x:       Math.random() * (W() + 300),
      y:       Math.random() * H(),
      speed:   6 + Math.random() * 11,
      len:     10 + Math.random() * 32,
      opacity: 0.07 + Math.random() * 0.38,
      width:   0.4  + Math.random() * 0.9,
    }));

    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W(), H());

      /* ── Gotas cayendo ── */
      for (const d of drops) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * SX, d.y - d.len * SY);
        ctx.strokeStyle = `rgba(185, 218, 255, ${d.opacity})`;
        ctx.lineWidth   = d.width;
        ctx.lineCap     = "round";
        ctx.stroke();

        d.x += d.speed * SX;
        d.y += d.speed * SY;

        /* Reiniciar al salir de pantalla */
        if (d.y > H() + d.len || d.x > W() + 150) {
          d.x = Math.random() * W() - d.speed * 25;
          d.y = -d.len - Math.random() * 120;
        }
      }

      /* ── Salpicaduras en la base ── */
      if (frame % 5 === 0) {
        for (let i = 0; i < 4; i++) {
          const px = Math.random() * W();
          const r  = 1 + Math.random() * 5;
          ctx.beginPath();
          ctx.ellipse(px, H() - 4, r * 2.2, r * 0.5, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(185, 218, 255, 0.22)";
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }

      /* ── Charco reflectante al fondo ── */
      const grad = ctx.createLinearGradient(0, H() - 60, 0, H());
      grad.addColorStop(0, "rgba(100,160,255,0)");
      grad.addColorStop(1, "rgba(100,160,255,0.06)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, H() - 60, W(), 60);

      frame++;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  /* ── Relámpagos aleatorios ── */
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleFlash = () => {
      timeoutId = setTimeout(() => {
        // Flash doble (más realista)
        setFlash(true);
        setTimeout(() => {
          setFlash(false);
          setTimeout(() => {
            setFlash(true);
            setTimeout(() => {
              setFlash(false);
              scheduleFlash();
            }, 70);
          }, 110);
        }, 90);
      }, 5000 + Math.random() * 14000);
    };

    scheduleFlash();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      {/* Atmósfera tormentosa azul-gris */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1, background: "linear-gradient(180deg, rgba(10,20,50,0.35) 0%, rgba(15,30,70,0.20) 60%, rgba(5,15,40,0.45) 100%)" }}
      />

      {/* Canvas — lluvia principal */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2, mixBlendMode: "screen" }}
      />

      {/* Gotitas en el vidrio */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
        {blobs.map((b, i) => (
          <div
            key={i}
            className="rain-blob"
            style={{
              left:              `${b.left}%`,
              top:               `${b.top}%`,
              width:             `${b.size}px`,
              height:            `${b.size * 1.4}px`,
              animationDelay:    `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Niebla/vapor en la base */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ zIndex: 4, height: "35%", background: "linear-gradient(to top, rgba(10,20,60,0.50) 0%, rgba(10,25,65,0.18) 60%, transparent 100%)" }}
      />

      {/* Relámpago */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-75"
        style={{ zIndex: 5, background: "rgba(200,220,255,0.09)", opacity: flash ? 1 : 0 }}
      />
    </>
  );
}
