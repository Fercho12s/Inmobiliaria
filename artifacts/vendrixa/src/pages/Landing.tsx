import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Home,
  DollarSign,
  Search,
  BedDouble,
  Maximize2,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const FEATURED_PROPERTIES = [
  {
    id: 1,
    title: "Palermo, Buenos Aires",
    beds: 4,
    area: "180 m²",
    garage: "2 cocheras",
    price: "$450,000",
    color: "from-slate-600 to-slate-900",
  },
  {
    id: 2,
    title: "Nordelta, Tigre",
    beds: 5,
    area: "320 m²",
    garage: "3 cocheras",
    price: "$780,000",
    color: "from-zinc-600 to-zinc-900",
  },
  {
    id: 3,
    title: "Puerto Madero, CABA",
    beds: 3,
    area: "120 m²",
    garage: "1 cochera",
    price: "$620,000",
    color: "from-neutral-600 to-neutral-900",
  },
];

const PARTNERS = ["REMAX", "ERA", "CENTURY 21", "COLDWELL BANKER", "SOTHEBY'S"];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── HERO ── */}
      <section className="pt-20 min-h-screen flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center py-16">

            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="space-y-8 order-2 lg:order-1"
            >
              <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Marketing Inmobiliario Premium
              </div>

              <h1 className="text-5xl sm:text-6xl xl:text-[4.5rem] font-bold text-foreground leading-[1.07] tracking-tight">
                Encuentra La Casa<br />
                Que Se Adapta<br />
                <span className="text-muted-foreground">A Ti</span>
              </h1>

              <p className="text-base text-muted-foreground leading-relaxed max-w-md">
                Queremos ayudarte a encontrar el hogar perfecto. Estamos listos
                para guiarte hacia una propiedad que se adapte a tu estilo de
                vida y necesidades.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/nuevo-listado"
                  className="inline-flex items-center gap-3 px-8 py-3.5 bg-foreground text-background font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Comenzar
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/listados"
                  className="inline-flex items-center gap-3 px-8 py-3.5 border border-border text-foreground font-medium text-xs uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Ver Demo
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-8 sm:gap-12 pt-6 border-t border-border">
                {[
                  { value: "1200+", label: "Propiedades" },
                  { value: "4500+", label: "Clientes Felices" },
                  { value: "100+", label: "Premios" },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right image */}
            <motion.div
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
              className="relative order-1 lg:order-2 h-[380px] sm:h-[480px] lg:h-[580px] overflow-hidden"
            >
              <img
                src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
                alt="Propiedad de lujo"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              {/* Floating card */}
              <div className="absolute bottom-6 left-6 bg-background/90 backdrop-blur-sm border border-border p-4 min-w-[190px] shadow-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                  Precio Promedio
                </p>
                <p className="text-xl font-bold text-foreground">$485,000</p>
                <p className="text-xs text-emerald-500 font-semibold mt-0.5">
                  ↑ +12.5% este mes
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SEARCH ── */}
      <section className="py-10 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card border border-border shadow-lg p-6 md:p-8">
            <p className="text-sm font-semibold text-foreground mb-5 uppercase tracking-wider">
              Buscar propiedades disponibles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { Icon: MapPin, label: "Ubicación" },
                { Icon: Home, label: "Tipo de Propiedad" },
                { Icon: DollarSign, label: "Presupuesto" },
              ].map(({ Icon, label }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border border-border bg-background px-4 py-3 cursor-pointer hover:bg-muted transition-colors"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
              <button className="bg-foreground text-background font-bold text-xs uppercase tracking-widest px-6 py-3 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                Buscar Ahora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── POPULAR PROPERTIES ── */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground mb-3 flex items-center gap-3">
                <span className="w-6 h-px bg-foreground inline-block" />
                Popular
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Nuestras Propiedades Populares
              </h2>
            </div>
            <Link
              href="/listados"
              className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 hover:gap-4 transition-all duration-200"
            >
              Ver Todo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_PROPERTIES.map((prop, i) => (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.55 }}
                className="group bg-card border border-border overflow-hidden hover:border-foreground/40 transition-colors duration-200"
              >
                {/* Gradient image placeholder */}
                <div
                  className={`relative h-52 bg-gradient-to-br ${prop.color} overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider bg-black/30 px-2 py-1">
                      #{String(prop.id).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="font-semibold text-foreground text-sm leading-snug">
                      {prop.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5" /> {prop.beds} Hab.
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5" /> {prop.area}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> {prop.garage}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Link
                      href="/listados"
                      className="px-5 py-2.5 bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Ver Más
                    </Link>
                    <p className="font-bold text-foreground text-sm">{prop.price}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE / TESTIMONIAL ── */}
      <section className="py-24 bg-zinc-950 dark:bg-[hsl(0_0%_3%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-base font-bold text-white">Carlos Méndez</p>
              <p className="text-sm text-zinc-400 mt-1">Fundador, VENDRIXA</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-serif text-white leading-relaxed">
                <span className="text-5xl text-zinc-600 font-serif leading-none">"</span>
                Nuestro negocio está construido sobre relaciones cercanas y
                estamos felices de compartir experiencias inmobiliarias positivas
                con nuestros clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section className="py-12 bg-zinc-950 dark:bg-[hsl(0_0%_3%)] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-8">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="text-xs font-bold uppercase tracking-[0.35em] text-zinc-600 hover:text-zinc-400 transition-colors cursor-default"
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
