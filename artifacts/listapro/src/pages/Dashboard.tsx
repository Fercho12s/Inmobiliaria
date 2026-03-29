import { Link } from "wouter";
import { motion } from "framer-motion";
import { Plus, Home as HomeIcon, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { useGetListings } from "@/hooks/useListings";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function Dashboard() {
  const { data: listings, isLoading, isError } = useGetListings();

  const hour            = new Date().getHours();
  const greeting        = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const totalListings   = listings?.length || 0;
  const totalGenerated  = listings?.filter(l => l.generatedDescription).length || 0;
  const readyToPublish  = listings?.filter(l => l.instagramCaption && (l.images?.length ?? 0) > 0).length || 0;

  // Compute chart data: listings count grouped by city
  const chartData = listings ? Object.entries(
    listings.reduce((acc: Record<string, number>, listing) => {
      const city = listing.city || "N/A";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count })) : [];

  // Recent activity: last 5 listings sorted by createdAt desc
  const recentActivity = listings 
    ? [...listings]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5)
    : [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const formatPrice = (price?: number, currency: string = "MXN") => {
    if (!price) return "$0";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-4xl font-sans font-bold text-white mb-2 tracking-tight">{greeting}, Agente.</h1>
            <p className="text-muted-foreground font-light uppercase tracking-widest text-sm">Gestiona tu portafolio de exclusivas.</p>
          </div>
          <Link 
            href="/nuevo-listado" 
            className="px-6 py-3 bg-white text-black text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Listado
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#111] border border-white/10 p-6">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Propiedades</h3>
            <p className="text-4xl font-sans font-bold text-white">{totalListings}</p>
          </div>
          <div className="bg-[#111] border border-white/10 p-6">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Contenido Generado</h3>
            <p className="text-4xl font-sans font-bold text-white">{totalGenerated}</p>
          </div>
          <div className="bg-[#111] border border-white/10 p-6">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Listos para Publicar</h3>
            <p className="text-4xl font-sans font-bold text-white">{readyToPublish}</p>
          </div>
        </div>

        {/* Chart and Activity Section */}
        {listings && listings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Distribution Chart */}
            <div className="lg:col-span-2 bg-[#111] border border-white/10 p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Distribución por Ciudad</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#888', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#888', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ 
                        backgroundColor: '#111', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0px'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#fff" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#fff" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#111] border border-white/10 p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Actividad Reciente</h3>
              <div className="space-y-4">
                {recentActivity.map((listing) => (
                  <Link key={listing.id} href={`/listados/${listing.id}`}>
                    <div className="group border border-white/5 p-4 hover:border-white/20 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-gray-300 transition-colors">
                          {listing.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap ml-2">
                          {formatDate(listing.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {listing.city}
                        </span>
                        <span className="text-white font-medium">
                          {formatPrice(listing.price, listing.currency)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-[#111] border border-white/5 h-[400px]" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20 bg-[#111] border border-destructive/20">
            <p className="text-destructive font-bold uppercase tracking-widest">Error al cargar las propiedades.</p>
          </div>
        ) : listings && listings.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {listings.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-32 bg-[#111] border border-white/5 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-none border border-white/10 flex items-center justify-center mb-6">
              <HomeIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-sans font-bold text-white mb-3 tracking-tight">Tu portafolio está vacío</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Aún no has agregado ninguna propiedad. Comienza a construir tu portafolio premium hoy mismo.
            </p>
            <Link 
              href="/nuevo-listado" 
              className="text-white hover:text-gray-300 font-bold tracking-widest uppercase text-sm border-b border-white pb-1"
            >
              Crear tu primer listado
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
