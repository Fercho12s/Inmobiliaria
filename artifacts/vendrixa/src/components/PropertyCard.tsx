import { Link } from "wouter";
import { Bed, Bath, Maximize, MapPin, Eye, Sparkles, Trash2, Car } from "lucide-react";
import { motion } from "framer-motion";
import type { Listing } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { apiClient } from "@/lib/apiClient";
import { useQueryClient } from "@tanstack/react-query";

interface PropertyCardProps {
  listing: Partial<Listing>;
  previewMode?: boolean;
}

export default function PropertyCard({ listing, previewMode = false }: PropertyCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleted,  setIsDeleted]  = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!listing.id) return;
    if (!window.confirm(`¿Eliminar "${listing.title}"? Esta acción no se puede deshacer.`)) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/listings/${listing.id}`);
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setIsDeleted(true);
      toast({ title: "Propiedad eliminada" });
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!listing.id) return;
    toast({ title: "Generando contenido IA…" });
    try {
      await apiClient.post(`/listings/${listing.id}/generate`, {});
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast({ title: "Contenido generado", description: "IA completó el análisis." });
    } catch {
      toast({ title: "Error al generar", variant: "destructive" });
    }
  };

  if (isDeleted) return null;

  const images = listing.images?.length
    ? listing.images
    : [`${import.meta.env.BASE_URL}images/placeholder-property.png`];

  const hasAI = !!(listing.generatedDescription || listing.instagramCaption);

  const CardContent = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`group relative w-full overflow-hidden bg-card border border-white/6 transition-colors duration-300 hover:border-primary/28 ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* ── Badges ── */}
      <div className="absolute top-3.5 left-3.5 z-20 flex gap-1.5">
        <span className="px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold tracking-[0.15em] uppercase border border-white/10">
          {listing.listingType === "renta" ? "Renta" : "Venta"}
        </span>
        {hasAI && (
          <span className="px-2.5 py-1 bg-primary/90 text-primary-foreground text-[9px] font-bold tracking-[0.15em] uppercase flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            IA
          </span>
        )}
      </div>

      {/* ── Image ── */}
      <div className="relative h-[220px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent z-10" />
        <img
          src={images[0]}
          alt={listing.title || "Propiedad"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />

        {/* Price overlay */}
        <div className="absolute bottom-4 left-4 z-20">
          <p className="font-display text-3xl leading-none gold-text tracking-wider">
            {formatPrice(listing.price, listing.currency)}
          </p>
          <p className="text-[9px] text-white/45 uppercase tracking-widest mt-0.5 font-sans">
            {listing.currency || "MXN"}
          </p>
        </div>

        {/* Property type — bottom right */}
        <div className="absolute bottom-4 right-4 z-20">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/55 bg-black/45 backdrop-blur-sm px-2 py-1">
            {listing.propertyType || "Propiedad"}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-5">
        <h3 className="text-sm font-bold text-foreground line-clamp-1 mb-2 tracking-tight">
          {listing.title || "Propiedad sin título"}
        </h3>
        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-4">
          <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
          <span className="line-clamp-1">
            {listing.city && listing.state
              ? `${listing.city}, ${listing.state}`
              : listing.city || "Sin ubicación"}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-white/35" />
            <span className="font-semibold text-foreground/75">{listing.bedrooms ?? 0}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="w-3.5 h-3.5 text-white/35" />
            <span className="font-semibold text-foreground/75">{listing.bathrooms ?? 0}</span>
          </span>
          {(listing.parkingSpots ?? 0) > 0 && (
            <span className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-white/35" />
              <span className="font-semibold text-foreground/75">{listing.parkingSpots}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 ml-auto">
            <Maximize className="w-3.5 h-3.5 text-white/35" />
            <span className="font-semibold text-foreground/75">
              {listing.area ?? 0} {listing.areaUnit || "m²"}
            </span>
          </span>
        </div>
      </div>

      {/* ── Hover action bar ── */}
      {!previewMode && (
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-background/96 backdrop-blur-sm border-t border-white/7 flex z-30">
          <div className="flex-1 flex flex-col items-center justify-center py-3 text-muted-foreground hover:text-foreground hover:bg-white/4 transition-colors cursor-pointer">
            <Eye className="w-3.5 h-3.5 mb-1" />
            <span className="text-[8px] uppercase font-bold tracking-widest">Ver</span>
          </div>
          <div className="w-px bg-white/6" />
          <button
            onClick={handleRegenerate}
            className="flex-1 flex flex-col items-center justify-center py-3 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 mb-1" />
            <span className="text-[8px] uppercase font-bold tracking-widest">IA</span>
          </button>
          <div className="w-px bg-white/6" />
          <button
            onClick={handleDelete}
            className="flex-1 flex flex-col items-center justify-center py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mb-1" />
            <span className="text-[8px] uppercase font-bold tracking-widest">Borrar</span>
          </button>
        </div>
      )}
    </motion.div>
  );

  if (previewMode || !listing.id) return CardContent;

  return (
    <Link href={`/listados/${listing.id}`} className="block">
      {CardContent}
    </Link>
  );
}
