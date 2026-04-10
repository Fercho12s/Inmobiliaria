import { Link } from "wouter";
import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  ArrowRight, MapPin, Home, DollarSign, Search,
  BedDouble, Maximize2, ChevronDown, Sparkles, FileText, Video,
} from "lucide-react";
import Navbar from "@/components/Navbar";

/* ─────────────────── DATA ─────────────────── */

const SERVICES = [
  {
    num: "01",
    title: "Vitrina Premium",
    desc: "Visuales de alto impacto que elevan la esencia única de cada propiedad.",
    icon: Home,
  },
  {
    num: "02",
    title: "Redacción IA",
    desc: "Descripciones inteligentes generadas en segundos, listas para publicar.",
    icon: Sparkles,
  },
  {
    num: "03",
    title: "Motor de Contenido",
    desc: "Captions para Instagram, brochures PDF y reels — desde un solo lugar.",
    icon: FileText,
  },
  {
    num: "04",
    title: "Reels Automáticos",
    desc: "Videos profesionales de cada propiedad renderizados sin esfuerzo.",
    icon: Video,
  },
];

const STATS = [
  { value: "1,200+", label: "Propiedades Listadas" },
  { value: "4,500+", label: "Clientes Satisfechos" },
  { value: "100%",   label: "Premium" },
];

const PARTNERS = ["REMAX", "ERA", "CENTURY 21", "COLDWELL BANKER", "SOTHEBY'S"];

const FEATURED = [
  { title: "Ocean Breeze Villa",   address: "Av. del Libertador 5200, Palermo", beds: 4, area: "180 m²", price: "$450,000", tag: "Venta" },
  { title: "Jakson House",         address: "Los Robles 120, Nordelta",          beds: 5, area: "320 m²", price: "$780,000", tag: "Exclusiva" },
  { title: "Lakeside Cottage",     address: "Pierina Dealessi 750, Puerto Madero", beds: 3, area: "120 m²", price: "$620,000", tag: "Nueva" },
];

/* ─────────────────── HELPERS ─────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-primary flex items-center gap-3 mb-5">
      <span className="w-8 h-px bg-primary inline-block" />
      {children}
    </p>
  );
}

function RevealBlock({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────── COMPONENT ─────────────────── */

export default function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY    = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOpac = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale= useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden grain">
      <Navbar />

      {/* ══════════════════════════════════════════════════
          HERO — 3D mesh + parallax scroll
      ══════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative w-full h-screen min-h-[640px] flex flex-col overflow-hidden">

        {/* 3D Mesh background — pure CSS, GPU-accelerated */}
        <div className="absolute inset-0 z-0">
          {/* Base dark */}
          <div className="absolute inset-0" style={{ background: "hsl(220,52%,6%)" }} />

          {/* Mesh orb 1 — deep blue */}
          <motion.div
            className="absolute inset-0"
            style={{ y: heroY, scale: heroScale }}
          >
            <div
              className="absolute w-[120%] h-[120%] -top-[10%] -left-[10%]"
              style={{
                background:
                  "radial-gradient(ellipse 70% 55% at 25% 35%, hsl(220,70%,14%) 0%, transparent 65%), " +
                  "radial-gradient(ellipse 55% 70% at 75% 65%, hsl(215,65%,11%) 0%, transparent 60%), " +
                  "radial-gradient(ellipse 65% 45% at 55% 15%, hsl(42,45%,9%) 0%, transparent 55%)",
                animation: "meshFloat1 20s ease-in-out infinite",
              }}
            />
          </motion.div>

          {/* Mesh orb 2 — accent layer */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 85% 55% at 70% 20%, hsl(225,60%,12%) 0%, transparent 55%), " +
                "radial-gradient(ellipse 45% 65% at 12% 78%, hsl(42,35%,8%) 0%, transparent 50%)",
              animation: "meshFloat2 26s ease-in-out infinite",
            }}
          />

          {/* 3D perspective grid */}
          <div className="absolute inset-0 hero-3d-grid opacity-100" />

          {/* Hero image */}
          <motion.img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.28, scale: heroScale, y: heroY }}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpac }}
          className="relative z-10 flex-1 flex flex-col justify-between pt-28 pb-0 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
        >
          {/* Main headline */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/45 mb-6 flex items-center gap-3"
            >
              <span className="w-10 h-px bg-white/30 inline-block" />
              Marketing Inmobiliario Premium
            </motion.p>

            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[clamp(4.5rem,13vw,11rem)] leading-[0.88] text-white tracking-wider uppercase"
              >
                VENDRIXA
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-5 text-base sm:text-lg font-light text-white/55 uppercase tracking-[0.22em] max-w-md"
            >
              Un nuevo estándar de vida moderna
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.0 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                href="/listados"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
              >
                <Search className="w-4 h-4" />
                Explorar Propiedades
              </Link>
              <Link
                href="/nuevo-listado"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 border border-white/22 text-white font-medium text-xs uppercase tracking-[0.15em] hover:bg-white/8 transition-colors"
              >
                Publicar Propiedad
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Bottom row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.7 }}
            className="flex items-end justify-between pb-7"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-white uppercase tracking-widest">Argentina · Uruguay · Paraguay</p>
              <p className="text-[10px] text-white/35 uppercase tracking-wider">Propiedades premium verificadas</p>
            </div>
            <div className="flex flex-col items-center gap-2 text-white/30">
              <span className="text-[9px] uppercase tracking-widest">Scroll</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </div>
          </motion.div>
        </motion.div>

        {/* Search pill — overlaps into next section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="relative z-20 mx-4 sm:mx-6 lg:mx-auto lg:max-w-4xl -mb-7"
        >
          <div className="bg-card/96 backdrop-blur-2xl border border-white/8 shadow-2xl p-1.5 flex flex-col sm:flex-row gap-1.5">
            {[
              { Icon: MapPin,     label: "Ubicación",          sub: "Ciudad o barrio" },
              { Icon: Home,       label: "Tipo de Propiedad",  sub: "Casa, Depto, PH…" },
              { Icon: DollarSign, label: "Presupuesto",        sub: "Rango de precio" },
            ].map(({ Icon, label, sub }, i) => (
              <div
                key={i}
                className="flex items-center gap-3 flex-1 px-4 py-3.5 hover:bg-white/4 transition-colors cursor-pointer border border-transparent hover:border-white/8"
              >
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground">{sub}</p>
                </div>
              </div>
            ))}
            <Link
              href="/listados"
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest px-7 py-3.5 hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              Buscar
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          SERVICES — Editorial dark grid
      ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-28 bg-card overflow-hidden">
        {/* Subtle bg accent */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 60% at 80% 20%, hsl(42,40%,8%) 0%, transparent 70%)",
            animation: "meshFloat3 28s ease-in-out infinite",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealBlock>
            <SectionLabel>Capacidades</SectionLabel>
            <h2 className="font-display text-[clamp(3rem,7vw,6rem)] text-foreground uppercase tracking-wider leading-none mb-16">
              Nuestros Servicios
            </h2>
          </RevealBlock>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <RevealBlock key={i} delay={i * 0.08}>
                  <div className="bg-card p-8 h-full group hover:bg-accent/30 transition-colors duration-300 cursor-default">
                    <div className="flex items-start justify-between mb-8">
                      <span className="font-display text-5xl gold-text tracking-wider opacity-60">{s.num}</span>
                      <Icon className="w-5 h-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-foreground mb-3">{s.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </RevealBlock>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURED PROPERTIES
      ══════════════════════════════════════════════════ */}
      <section className="py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealBlock className="flex items-end justify-between mb-14 gap-6 flex-wrap">
            <div>
              <SectionLabel>Destacadas</SectionLabel>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
                Más Visitadas
              </h2>
            </div>
            <Link
              href="/listados"
              className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 pb-1 border-b border-white/10 hover:border-white/30"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </RevealBlock>

          {/* Featured grid — 1 big + 2 stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Big card */}
            <RevealBlock className="lg:col-span-3">
              <Link href="/listados" className="group block relative overflow-hidden bg-card border border-white/6 hover:border-primary/25 transition-colors h-full min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-800 to-slate-900" />
                <img
                  src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500 group-hover:scale-[1.03] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute top-5 left-5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/60 border border-white/15 px-3 py-1.5 backdrop-blur-sm">
                    {FEATURED[0].tag}
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="font-display text-4xl gold-text tracking-wider mb-1">{FEATURED[0].price}</p>
                  <p className="text-lg font-bold text-white mb-2">{FEATURED[0].title}</p>
                  <p className="text-xs text-white/45 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-primary/60" />
                    {FEATURED[0].address}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-[11px] text-white/50">
                    <span className="flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5" />{FEATURED[0].beds}</span>
                    <span className="flex items-center gap-1.5"><Maximize2 className="w-3.5 h-3.5" />{FEATURED[0].area}</span>
                  </div>
                </div>
              </Link>
            </RevealBlock>

            {/* 2 small cards */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {FEATURED.slice(1).map((p, i) => (
                <RevealBlock key={i} delay={0.1 + i * 0.1} className="flex-1">
                  <Link href="/listados" className="group block relative overflow-hidden bg-card border border-white/6 hover:border-primary/25 transition-colors h-full min-h-[190px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 border border-white/12 px-2.5 py-1 backdrop-blur-sm">
                        {p.tag}
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="font-display text-2xl gold-text tracking-wider mb-0.5">{p.price}</p>
                      <p className="text-sm font-bold text-white mb-1.5">{p.title}</p>
                      <p className="text-[10px] text-white/40 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-primary/50" />{p.address}
                      </p>
                    </div>
                  </Link>
                </RevealBlock>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SPLIT CTA
      ══════════════════════════════════════════════════ */}
      <section className="py-28 bg-card overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left visual */}
            <RevealBlock>
              <div className="relative h-[380px] sm:h-[460px] overflow-hidden">
                {/* 3D mesh behind image */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 80% at 50% 50%, hsl(220,60%,10%) 0%, hsl(220,52%,6%) 100%)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse 60% 40% at 20% 80%, hsl(42,40%,8%) 0%, transparent 60%), " +
                      "radial-gradient(ellipse 50% 50% at 80% 20%, hsl(220,65%,12%) 0%, transparent 55%)",
                    animation: "meshFloat2 24s ease-in-out infinite",
                  }}
                />
                <img
                  src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
                  alt="Propiedad"
                  className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

                {/* Floating stat */}
                <div className="absolute bottom-6 left-6 bg-background/88 backdrop-blur-md border border-white/8 p-5">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Disponibles Ahora</p>
                  <p className="text-2xl font-bold text-foreground">1,200+ Propiedades</p>
                </div>

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-primary/20" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-l border-b border-primary/15" />
              </div>
            </RevealBlock>

            {/* Right text */}
            <RevealBlock delay={0.15} className="space-y-8">
              <SectionLabel>Para Profesionales</SectionLabel>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.05] tracking-tight">
                El Método Más Fácil Para Vender Más
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Optimiza tu flujo de trabajo inmobiliario con IA que genera descripciones, imágenes y contenido de marketing — todo en segundos. Únete a la nueva ola del marketing de propiedades.
              </p>

              {/* Feature bullets */}
              <div className="space-y-3">
                {[
                  "Descripciones con IA listas en segundos",
                  "Imágenes y reels generados automáticamente",
                  "Publicación directa a Instagram",
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/nuevo-listado"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
                >
                  Comenzar Gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/listados"
                  className="inline-flex items-center gap-2.5 px-8 py-4 border border-white/15 text-foreground font-medium text-xs uppercase tracking-[0.15em] hover:bg-white/4 transition-colors"
                >
                  Ver Demo
                </Link>
              </div>
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════ */}
      <section className="py-16 bg-background border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/6">
            {STATS.map((s, i) => (
              <RevealBlock key={i} delay={i * 0.1} className="text-center sm:text-left px-8 py-8 sm:py-0">
                <p className="font-display text-6xl gold-shimmer tracking-wider mb-1">{s.value}</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{s.label}</p>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          QUOTE
      ══════════════════════════════════════════════════ */}
      <section
        className="relative py-28 overflow-hidden"
        style={{ background: "hsl(220,52%,5%)" }}
      >
        {/* 3D mesh bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 30% 50%, hsl(220,65%,9%) 0%, transparent 60%), " +
              "radial-gradient(ellipse 50% 70% at 75% 40%, hsl(42,35%,7%) 0%, transparent 55%)",
            animation: "meshFloat1 30s ease-in-out infinite",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealBlock>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
              <div className="md:col-span-2">
                <div className="w-12 h-12 border border-primary/25 flex items-center justify-center mb-5">
                  <span className="font-display text-primary text-xl">VX</span>
                </div>
                <p className="text-base font-bold text-white">Fernando Holguín</p>
                <p className="text-sm mt-1 gold-text">Fundador, VENDRIXA</p>
                <div className="w-10 h-px mt-5 bg-primary/40" />
              </div>
              <div className="md:col-span-3">
                <span
                  className="font-serif text-8xl leading-none block mb-0 -mt-4"
                  style={{ color: "hsl(42,62%,22%)" }}
                >
                  "
                </span>
                <p className="text-xl sm:text-2xl font-serif text-white/85 leading-relaxed -mt-6">
                  Nuestro negocio está construido sobre relaciones cercanas y estamos felices de poder compartir experiencias inmobiliarias extraordinarias con cada uno de nuestros clientes.
                </p>
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PARTNERS
      ══════════════════════════════════════════════════ */}
      <section
        className="py-10 border-t border-white/4"
        style={{ background: "hsl(220,52%,5%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-8">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="text-[10px] font-bold uppercase tracking-[0.4em] transition-colors duration-300 cursor-default select-none"
                style={{ color: "hsl(220,25%,26%)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(42,62%,48%)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(220,25%,26%)")}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
