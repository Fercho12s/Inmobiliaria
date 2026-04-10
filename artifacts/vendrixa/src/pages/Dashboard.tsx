import { useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Plus, Home as HomeIcon, MapPin, TrendingUp, Sparkles, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import AllPropertiesMap from "@/components/AllPropertiesMap";
import { useGetListings } from "@/hooks/useListings";
import { formatPrice } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

/* ─────────────── ANIMATED STAT CARD ─────────────── */
function StatCard({
  label,
  value,
  Icon,
  delay = 0,
}: {
  label: string;
  value: number | string;
  Icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
        <Icon className="w-4 h-4 text-primary/35 group-hover:text-primary/70 transition-colors" />
      </div>
      <motion.p
        initial={{ opacity: 0, scale: 0.85 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: delay + 0.15, ease: [0.34, 1.56, 0.64, 1] }}
        className="font-display text-6xl gold-text tracking-wider leading-none"
      >
        {value}
      </motion.p>
    </motion.div>
  );
}

/* ─────────────── CUSTOM TOOLTIP ─────────────── */
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-white/10 px-4 py-3 text-xs">
      <p className="text-muted-foreground mb-1 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-white font-bold">{payload[0].value} propiedad{payload[0].value !== 1 ? "es" : ""}</p>
    </div>
  );
}

/* ─────────────── MAIN ─────────────── */
export default function Dashboard() {
  const { data: listings, isLoading, isError } = useGetListings();

  const hour           = new Date().getHours();
  const greeting       = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const totalListings  = listings?.length || 0;
  const totalGenerated = listings?.filter((l) => l.generatedDescription).length || 0;
  const readyToPublish = listings?.filter((l) => l.instagramCaption && (l.images?.length ?? 0) > 0).length || 0;

  const chartData = listings
    ? Object.entries(
        listings.reduce((acc: Record<string, number>, l) => {
          const city = l.city || "N/A";
          acc[city] = (acc[city] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, count]) => ({ name, count }))
    : [];

  const recentActivity = listings
    ? [...listings]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5)
    : [];

  const formatDate = (d?: string) => {
    if (!d) return "";
    const date = new Date(d);
    const diff = Math.ceil((Date.now() - date.getTime()) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    if (diff < 7) return `Hace ${diff}d`;
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <main className="pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 pb-8 border-b border-white/6"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">{greeting},</h1>
            <p className="text-sm text-muted-foreground font-light uppercase tracking-[0.2em]">Gestiona tu portafolio de exclusivas.</p>
          </div>
          <Link
            href="/nuevo-listado"
            className="flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nuevo Listado
          </Link>
        </motion.div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          <StatCard label="Propiedades"       value={totalListings}  Icon={HomeIcon}      delay={0} />
          <StatCard label="Contenido IA"      value={totalGenerated} Icon={Sparkles}      delay={0.08} />
          <StatCard label="Listos a Publicar" value={readyToPublish} Icon={CheckCircle2}  delay={0.16} />
        </div>

        {/* ── Chart + Activity ── */}
        {listings && listings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-14">

            {/* Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.65 }}
              className="lg:col-span-2 bg-card border border-white/6 p-7"
            >
              <div className="flex items-center gap-3 mb-7">
                <TrendingUp className="w-4 h-4 text-primary/50" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  Distribución por Ciudad
                </p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={28}>
                    <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "Space Grotesk" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 11 }}
                      allowDecimals={false}
                      width={28}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === 0 ? "hsl(42,62%,48%)" : i === 1 ? "hsl(38,50%,38%)" : "rgba(255,255,255,0.25)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.65 }}
              className="bg-card border border-white/6 p-7"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-6">
                Actividad Reciente
              </p>
              <div className="space-y-1">
                {recentActivity.map((listing, i) => (
                  <Link key={listing.id} href={`/listados/${listing.id}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="group flex items-start justify-between gap-3 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/3 -mx-2 px-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {listing.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{listing.city}</span>
                          <span className="text-primary/70 font-semibold shrink-0">
                            {formatPrice(listing.price, listing.currency)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider shrink-0 pt-0.5">
                        {formatDate(listing.createdAt)}
                      </span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Map ── */}
        {listings && listings.length > 0 && (
          <AllPropertiesMap listings={listings} />
        )}

        {/* ── Listings Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-card border border-white/5 h-[360px]" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20 bg-card border border-destructive/15">
            <p className="text-destructive text-xs font-bold uppercase tracking-widest">
              Error al cargar las propiedades.
            </p>
          </div>
        ) : listings && listings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {listings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <PropertyCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-32 bg-card border border-white/5 flex flex-col items-center">
            <div className="w-16 h-16 border border-white/8 flex items-center justify-center mb-6">
              <HomeIcon className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Tu portafolio está vacío</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
              Aún no has agregado propiedades. Comienza a construir tu portafolio premium hoy mismo.
            </p>
            <Link
              href="/nuevo-listado"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white hover:text-primary transition-colors border-b border-white/20 hover:border-primary/40 pb-1"
            >
              Crear primer listado
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
