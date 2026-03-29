import { Link } from "wouter";
import { Bed, Bath, Maximize, MapPin, Eye, Sparkles, Trash2 } from "lucide-react";
import type { Listing } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";

interface PropertyCardProps {
  listing: Partial<Listing>;
  previewMode?: boolean;
}

export default function PropertyCard({ listing, previewMode = false }: PropertyCardProps) {
  const { toast } = useToast();
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("¿Estás seguro de eliminar esta propiedad?")) {
      toast({
        title: "Eliminando...",
        description: "La propiedad ha sido eliminada.",
      });
      setIsDeleted(true);
    }
  };

  const handleRegenerate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast({
      title: "Generando...",
      description: "Generando contenido con IA para esta propiedad.",
    });
  };

  if (isDeleted) return null;

  const images = listing.images && listing.images.length > 0 
    ? listing.images 
    : [`${import.meta.env.BASE_URL}images/placeholder-property.png`];

  const CardContent = (
    <div className={`group relative w-full rounded-none overflow-hidden bg-card border border-white/5 transition-all duration-500 hover:border-white/30 ${previewMode ? 'shadow-2xl' : ''}`}>
      
      {/* Type Badge */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold tracking-wider uppercase border border-white/10">
          {listing.listingType || "Venta"}
        </span>
        <span className="px-3 py-1 bg-white text-black text-xs font-bold tracking-wider uppercase">
          {listing.propertyType || "Propiedad"}
        </span>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <img 
          src={images[0]} 
          alt={listing.title || "Propiedad"} 
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Price overlay */}
        <div className="absolute bottom-4 left-4 z-20">
          <p className="text-2xl font-sans text-white font-bold tracking-wide">
            {formatPrice(listing.price, listing.currency)} <span className="text-sm font-sans font-normal opacity-80">{listing.currency || "MXN"}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-sans font-bold text-foreground line-clamp-1 mb-2 group-hover:text-white transition-colors">
          {listing.title || "Título de la propiedad"}
        </h3>
        
        <div className="flex items-center text-muted-foreground text-sm mb-6 gap-2">
          <MapPin className="w-4 h-4 text-white" />
          <span className="line-clamp-1">
            {listing.city && listing.state ? `${listing.city}, ${listing.state}` : "Ubicación no especificada"}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bed className="w-4 h-4 text-white" />
            <span className="text-sm font-medium">{listing.bedrooms || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bath className="w-4 h-4 text-white" />
            <span className="text-sm font-medium">{listing.bathrooms || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Maximize className="w-4 h-4 text-white" />
            <span className="text-sm font-medium">{listing.area || 0} {listing.areaUnit || "m²"}</span>
          </div>
        </div>
      </div>

      {/* Action Bar (Hover) */}
      {!previewMode && (
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-[#111111] border-t border-white/10 p-2 flex justify-around items-center z-30 shadow-lg">
          <div className="flex flex-col items-center p-2 text-muted-foreground hover:text-white transition-colors cursor-pointer w-full text-center">
            <Eye className="w-4 h-4 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Ver</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div onClick={handleRegenerate} className="flex flex-col items-center p-2 text-muted-foreground hover:text-white transition-colors cursor-pointer w-full text-center">
            <Sparkles className="w-4 h-4 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Generar</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div onClick={handleDelete} className="flex flex-col items-center p-2 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer w-full text-center">
            <Trash2 className="w-4 h-4 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Eliminar</span>
          </div>
        </div>
      )}
    </div>
  );

  if (previewMode || !listing.id) {
    return CardContent;
  }

  return (
    <Link href={`/listados/${listing.id}`} className="block">
      {CardContent}
    </Link>
  );
}
