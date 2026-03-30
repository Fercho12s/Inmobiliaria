import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, MapPin, Home, DollarSign, Search,
  BedDouble, Maximize2, Car, ChevronDown,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import RainEffect from "@/components/RainEffect";

/* ─────────────────────────────── DATA ─────────────────────────────── */

const SERVICES = [
  {
    num: "01",
    title: "VITRINA DE PROPIEDADES",
    desc: "Visuales elegantes de alto impacto que elevan la esencia única de cada propiedad.",
    gradient: "from-slate-800 via-slate-700 to-slate-900",
  },
  {
    num: "02",
    title: "REDACCIÓN CON IA",
    desc: "Descripciones inteligentes y emocionalmente resonantes generadas en segundos.",
    gradient: "from-blue-950 via-blue-900 to-slate-900",
  },
  {
    num: "03",
    title: "MOTOR DE CONTENIDO",
    desc: "Captions para Instagram, brochures PDF y reels de video — todo desde un solo lugar.",
    gradient: "from-indigo-950 via-slate-800 to-slate-900",
  },
  {
    num: "04",
    title: "ANALÍTICAS",
    desc: "Datos e insights para maximizar el rendimiento y alcance de tus listados.",
    gradient: "from-zinc-800 via-zinc-700 to-zinc-900",
  },
];

const PROPERTIES = [
  {
    id: 1,
    address: "Av. del Libertador 5200, Palermo",
    title: "Ocean Breeze Villa",
    beds: 4, baths: 2,
    area: "180 m²",
    price: "$450,000",
    gradient: "from-sky-900 via-slate-800 to-slate-900",
  },
  {
    id: 2,
    address: "Los Robles 120, Nordelta",
    title: "Jakson House",
    beds: 5, baths: 3,
    area: "320 m²",
    price: "$780,000",
    gradient: "from-slate-700 via-slate-800 to-blue-950",
  },
  {
    id: 3,
    address: "Pierina Dealessi 750, Puerto Madero",
    title: "Lakeside Cottage",
    beds: 3, baths: 2,
    area: "120 m²",
    price: "$620,000",
    gradient: "from-zinc-700 via-slate-700 to-slate-900",
  },
];

const STATS = [
  { value: "1200+", label: "Propiedades Listadas" },
  { value: "4500+", label: "Clientes Satisfechos" },
  { value: "100%",  label: "Premium" },
];

const PARTNERS = ["REMAX", "ERA", "CENTURY 21", "COLDWELL BANKER", "SOTHEBY'S"];

/* ─────────────────────────────── COMPONENT ─────────────────────────────── */

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* ═══════════════════════════════════════════════
          HERO — full-screen, Glasshaven style
      ═══════════════════════════════════════════════ */}
      <section className="relative w-full h-screen min-h-[600px] flex flex-col">

        {/* Background: video loop → animated gradient fallback */}
        <div className="absolute inset-0 z-0">
          {/* Animated gradient always visible as base */}
          <div className="hero-animated-bg absolute inset-0" />
          {/* Video sits on top; hides itself if file not found */}
          <video
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
          >
            <source src={`${import.meta.env.BASE_URL}videos/hero.mp4`} type="video/mp4" />
          </video>
          {/* Hero image fallback layer */}
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          {/* Rain effect — gotas, relámpagos, gotitas en vidrio */}
          <RainEffect />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-between pt-24 pb-0 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

          {/* Main headline — Glasshaven big title */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-1 flex flex-col justify-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50 mb-5 flex items-center gap-3">
              <span className="w-8 h-px bg-white/40 inline-block" />
              Marketing Inmobiliario Premium
            </p>
            <h1 className="font-display text-[clamp(3.5rem,11vw,9rem)] leading-none text-white tracking-wider uppercase">
              VENDRIXA
            </h1>
            <p className="mt-4 text-lg sm:text-xl font-light text-white/70 uppercase tracking-[0.2em] max-w-lg">
              Un nuevo estándar de vida moderna
            </p>
          </motion.div>

          {/* Bottom row: tagline left + location right + scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-end justify-between pb-6"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white uppercase tracking-widest">
                Encuentra Tu Próximo Hogar
              </p>
              <p className="text-xs text-white/50 uppercase tracking-wider">
                Argentina · Uruguay · Paraguay
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 text-white/40">
              <span className="text-[10px] uppercase tracking-widest">Explorar</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </div>
          </motion.div>
        </div>

        {/* Pill search bar — overlaps into next section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="relative z-20 mx-4 sm:mx-6 lg:mx-auto lg:max-w-4xl -mb-8"
        >
          <div className="bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl p-2 flex flex-col sm:flex-row gap-2">
            {[
              { Icon: MapPin,     label: "Ubicación",          sub: "Ciudad o barrio" },
              { Icon: Home,       label: "Tipo de Propiedad",  sub: "Casa, Depto, PH..." },
              { Icon: DollarSign, label: "Presupuesto",        sub: "Rango de precio" },
            ].map(({ Icon, label, sub }, i) => (
              <div
                key={i}
                className="flex items-center gap-3 flex-1 px-4 py-3 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border"
              >
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground">{sub}</p>
                </div>
              </div>
            ))}
            <Link
              href="/listados"
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              Buscar
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          SERVICES — Glasshaven style, dark bg + video
      ═══════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-24 bg-card overflow-hidden">
        {/* Background video for services section */}
        <div className="absolute inset-0 z-0 opacity-20">
          <video
            autoPlay loop muted playsInline
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
          >
            <source src={`${import.meta.env.BASE_URL}videos/services.mp4`} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-card via-transparent to-card" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] text-foreground uppercase tracking-wider leading-none">
              Nuestros Servicios
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.55 }}
                className="group"
              >
                {/* Image area */}
                <div className={`relative h-44 bg-gradient-to-br ${s.gradient} overflow-hidden rounded-sm mb-4`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-primary/10" />
                </div>
                {/* Text */}
                <p className="font-display text-4xl gold-text tracking-wider mb-2">{s.num}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-2">{s.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MOST VIEWED — Rent H&U style
      ═══════════════════════════════════════════════ */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-10 h-px bg-primary/50" />
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Destacadas</span>
              <span className="w-10 h-px bg-primary/50" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Más Visitadas</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Descubre propiedades exclusivas en las mejores ubicaciones. Reserva de forma segura y con soporte experto.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROPERTIES.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.55 }}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
              >
                {/* Image */}
                <div className={`relative h-52 bg-gradient-to-br ${p.gradient} overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold text-white/70 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full uppercase tracking-wider">
                      Nuevo
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-primary" />
                    {p.address}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-primary/70" /> {p.beds}
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-primary/70" /> {p.baths}
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-primary/70" /> {p.area}
                    </span>
                  </div>
                  <p className="text-base font-bold text-foreground mb-1">{p.title}</p>
                  <p className="text-lg font-bold gold-text">{p.price}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <Link
              href="/listados"
              className="inline-flex items-center gap-3 px-8 py-3.5 border border-primary/40 text-primary font-semibold text-sm uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-200 rounded-lg"
            >
              Ver todas las propiedades
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SPLIT CTA — "El método más fácil"
      ═══════════════════════════════════════════════ */}
      <section className="py-24 bg-card overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative h-[360px] sm:h-[440px] rounded-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-800 to-slate-900" />
              <img
                src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
                alt="Propiedad"
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {/* Floating badge */}
              <div className="absolute bottom-6 left-6 bg-background/85 backdrop-blur-sm border border-border rounded-lg p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Disponibles Ahora</p>
                <p className="text-xl font-bold text-foreground">1,200+ Propiedades</p>
              </div>
            </motion.div>

            {/* Right text */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-7"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary flex items-center gap-3">
                <span className="w-6 h-px bg-primary inline-block" />
                Para Profesionales
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                El Método Más Fácil Para Encontrar Una Casa
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Optimiza tu flujo de trabajo inmobiliario con IA que genera descripciones, imágenes y contenido de marketing — todo en segundos. Únete a la nueva ola del marketing de propiedades.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/nuevo-listado"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-lg"
                >
                  Comenzar Gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/listados"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-border text-foreground font-medium text-xs uppercase tracking-widest hover:bg-muted transition-colors rounded-lg"
                >
                  Ver Demo
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS STRIP
      ═══════════════════════════════════════════════ */}
      <section className="py-16 bg-background border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-10 text-center sm:text-left">
            {STATS.map((s, i) => (
              <div key={i} className="flex-1">
                <p className="font-display text-5xl gold-text tracking-wider">{s.value}</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          QUOTE / TESTIMONIAL
      ═══════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden" style={{ background: "hsl(220,52%,6%)" }}>
        <div className="absolute inset-0 opacity-10">
          <video
            autoPlay loop muted playsInline
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
          >
            <source src={`${import.meta.env.BASE_URL}videos/quote.mp4`} type="video/mp4" />
          </video>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center"
          >
            <div className="md:col-span-2">
              <p className="text-base font-bold text-white">Fernando Holguín</p>
              <p className="text-sm mt-1" style={{ color: "hsl(42,62%,48%)" }}>Fundador, VENDRIXA</p>
              <div className="w-12 h-px mt-6" style={{ background: "hsl(42,62%,48%)" }} />
            </div>
            <div className="md:col-span-3">
              <span className="font-serif text-7xl leading-none" style={{ color: "hsl(42,62%,30%)" }}>"</span>
              <p className="text-xl sm:text-2xl font-serif text-white/90 leading-relaxed -mt-4">
                Nuestro negocio está construido sobre relaciones cercanas y estamos felices de poder compartir experiencias inmobiliarias extraordinarias con cada uno de nuestros clientes.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PARTNERS
      ═══════════════════════════════════════════════ */}
      <section className="py-12 border-t border-white/5" style={{ background: "hsl(220,52%,5%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-8">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="text-xs font-bold uppercase tracking-[0.4em] transition-colors cursor-default"
                style={{ color: "hsl(220,25%,30%)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(42,62%,48%)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(220,25%,30%)")}
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
