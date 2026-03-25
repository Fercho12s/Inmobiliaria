import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Bed, Bath, Maximize, MapPin, Sparkles, 
  Copy, Download, Check, Instagram, Phone, Mail 
} from "lucide-react";
import { useState } from "react";
import {
  useGetListingById,
  useGenerateListingContent,
  getGetListingByIdQueryKey
} from "@/hooks/useListings";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import PropertyMap from "@/components/PropertyMap";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedIg, setCopiedIg] = useState(false);
  const [activeTab, setActiveTab] = useState<"desc" | "ig" | "hooks">("desc");

  const { data: listing, isLoading, isError } = useGetListingById(Number(id));
  
  const generateMutation = useGenerateListingContent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetListingByIdQueryKey(Number(id)) });
        toast({
          title: "Contenido Generado",
          description: "La magia de la IA ha hecho su trabajo.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "No se pudo generar el contenido con IA.",
          variant: "destructive"
        });
      }
    }
  });

  const formatPrice = (price?: number, currency: string = "MXN") => {
    if (!price) return "$0";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const copyToClipboard = (text: string, isIg: boolean) => {
    navigator.clipboard.writeText(text);
    if (isIg) {
      setCopiedIg(true);
      setTimeout(() => setCopiedIg(false), 2000);
    } else {
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
    toast({ title: "Copiado al portapapeles" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-32 px-4 flex justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-white/50" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen bg-background pt-32 px-4 text-center text-white">
        Error al cargar la propiedad. <Link href="/listados" className="text-white underline">Volver</Link>
      </div>
    );
  }

  const mainImage = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : `${import.meta.env.BASE_URL}images/placeholder-property.png`;

  // Derived content for new tabs
  const shortCaption = listing.instagramCaption ? listing.instagramCaption.split('\n')[0] + "..." : "";
  const longCaption = listing.instagramCaption || "";
  const hashtagsMatch = listing.instagramCaption ? listing.instagramCaption.match(/#\w+/g) : [];
  const hashtags = hashtagsMatch ? hashtagsMatch.join(" ") : "#RealEstate #Luxury";

  const derivedHooks = [
    `¡Descubre tu nuevo hogar en ${listing.city}!`,
    `Una oportunidad única: ${listing.propertyType} en ${listing.listingType}`,
    `${listing.bedrooms} recámaras de puro confort`,
    `Diseño excepcional en cada uno de sus ${listing.area} ${listing.areaUnit}`,
    `La exclusividad te espera. Contáctame hoy.`
  ];

  const suggestedNames = [
    `The ${listing.propertyType} at ${listing.city.split(' ')[0] || 'City'}`,
    `Villa ${listing.address.split(' ')[0] || 'Oasis'}`,
    `Residencia ${listing.listingType === 'venta' ? 'Aura' : 'Serenity'}`
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 lg:pt-32 pb-20 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/listados" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 text-sm font-bold uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Volver a Listados
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Columna Izquierda: Galería y Detalles Físicos */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[16/10] overflow-hidden mb-8 border border-white/5"
            >
              <img src={mainImage} alt={listing.title} className="w-full h-full object-cover" />
              <div className="absolute top-6 left-6 flex gap-2">
                <span className="px-4 py-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold tracking-widest uppercase border border-white/10">
                  {listing.listingType}
                </span>
                <span className="px-4 py-1.5 bg-white text-black text-xs font-bold tracking-widest uppercase">
                  {listing.propertyType}
                </span>
              </div>
            </motion.div>

            <div className="mb-12">
              <h1 className="text-4xl lg:text-5xl font-sans font-bold text-white tracking-tight leading-tight mb-4">{listing.title}</h1>
              <p className="text-3xl font-sans font-bold text-white mb-6">
                {formatPrice(listing.price, listing.currency)} <span className="text-xl opacity-80 text-muted-foreground font-sans font-normal">{listing.currency}</span>
              </p>
              
              <div className="flex items-center gap-2 text-muted-foreground mb-8">
                <MapPin className="w-5 h-5 text-white" />
                <span className="text-lg font-light">{listing.address}, {listing.city}, {listing.state}</span>
              </div>

              <div className="flex flex-wrap items-center gap-8 py-6 border-y border-white/10 mb-10">
                <div className="flex items-center gap-3">
                  <Bed className="w-6 h-6 text-white" />
                  <div>
                    <p className="text-white text-xl font-bold">{listing.bedrooms}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Recámaras</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bath className="w-6 h-6 text-white" />
                  <div>
                    <p className="text-white text-xl font-bold">{listing.bathrooms}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Baños</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Maximize className="w-6 h-6 text-white" />
                  <div>
                    <p className="text-white text-xl font-bold">{listing.area}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{listing.areaUnit}</p>
                  </div>
                </div>
              </div>

              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Amenidades</h3>
                  <div className="flex flex-wrap gap-3">
                    {listing.amenities.map(am => (
                      <span key={am} className="px-4 py-2 border border-white/10 bg-[#111111] text-sm font-light text-muted-foreground">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Información del Agente</h3>
                <div className="bg-[#111111] border border-white/10 p-6 flex flex-col sm:flex-row gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">Nombre</p>
                    <p className="text-white font-sans font-bold text-xl">{listing.agentName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">Contacto</p>
                    <div className="flex items-center gap-4 text-muted-foreground font-light mt-2">
                      <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-white"/> {listing.agentPhone}</span>
                      <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-white"/> {listing.agentEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Scoring Section */}
              <div className="mt-12">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Score de Atracción</h3>
                <div className="bg-[#111111] border border-white/10 p-8">
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <span className="text-6xl font-sans font-bold text-white leading-none">
                        {listing.attractivenessScore || 0}
                      </span>
                      <span className="text-xl text-muted-foreground ml-2">/100</span>
                    </div>
                    <div className="px-4 py-1.5 bg-white/5 border border-white/10 text-white text-[10px] font-bold tracking-widest uppercase">
                      {listing.priceLevel === 'bajo' ? 'Precio Bajo' : 
                       listing.priceLevel === 'promedio' ? 'Precio Promedio' : 
                       listing.priceLevel === 'alto' ? 'Precio Alto' : 'N/A'}
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-1000 ease-out"
                      style={{ width: `${listing.attractivenessScore || 0}%` }}
                    />
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground font-light italic">
                    Este score se basa en ubicación, precio de mercado y amenidades.
                  </p>
                </div>
              </div>

              {/* Leaflet Map Section */}
              <PropertyMap city={listing.city} />
            </div>
          </div>

          {/* Columna Derecha: AI Studio */}
          <div className="lg:col-span-5">
            <div className="sticky top-32">
              <div className="bg-[#111111] border border-white/10 p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-white" />
                    <h2 className="text-2xl font-sans font-bold text-white tracking-tight">AI Content Studio</h2>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground font-light mb-8 leading-relaxed">
                  Utiliza inteligencia artificial para redactar descripciones magnéticas y contenido para redes sociales basado en los datos de la propiedad.
                </p>

                {(!listing.generatedDescription && !listing.instagramCaption) ? (
                  <button
                    onClick={() => generateMutation.mutate({ id: Number(id) })}
                    disabled={generateMutation.isPending}
                    className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest flex justify-center items-center gap-3 hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    {generateMutation.isPending ? "Generando Magia..." : "Generar Contenido"}
                  </button>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    {/* Suggested Names */}
                    <div className="bg-[#1A1A1A] border border-white/5 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Nombres Sugeridos</h4>
                      <ul className="list-disc list-inside text-sm text-white font-light pl-4 space-y-1">
                        {suggestedNames.map((name, i) => (
                          <li key={i}>{name}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                      <button 
                        onClick={() => setActiveTab("desc")} 
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'desc' ? 'border-white text-white' : 'border-transparent text-muted-foreground hover:text-white'}`}
                      >
                        Descripción
                      </button>
                      <button 
                        onClick={() => setActiveTab("ig")} 
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'ig' ? 'border-white text-white' : 'border-transparent text-muted-foreground hover:text-white'}`}
                      >
                        Instagram
                      </button>
                      <button 
                        onClick={() => setActiveTab("hooks")} 
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'hooks' ? 'border-white text-white' : 'border-transparent text-muted-foreground hover:text-white'}`}
                      >
                        Hooks
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[200px]">
                      {activeTab === 'desc' && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Descripción Editorial</h4>
                            <button 
                              onClick={() => copyToClipboard(listing.generatedDescription || '', false)}
                              className="text-muted-foreground hover:text-white transition-colors"
                            >
                              {copiedDesc ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="bg-background border border-white/5 p-5 text-sm font-light leading-relaxed text-muted-foreground max-h-64 overflow-y-auto">
                            {listing.generatedDescription}
                          </div>
                        </div>
                      )}

                      {activeTab === 'ig' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                              <Instagram className="w-4 h-4"/> Captions & Hashtags
                            </h4>
                            <button 
                              onClick={() => copyToClipboard(listing.instagramCaption || '', true)}
                              className="text-muted-foreground hover:text-white transition-colors"
                            >
                              {copiedIg ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="bg-background border border-white/5 p-4 text-sm font-light leading-relaxed text-muted-foreground">
                            <p className="font-bold text-white mb-1 text-xs">Short:</p>
                            <p className="mb-4">{shortCaption}</p>
                            
                            <p className="font-bold text-white mb-1 text-xs">Long:</p>
                            <p className="mb-4 whitespace-pre-wrap">{longCaption}</p>

                            <p className="font-bold text-white mb-1 text-xs">Hashtags:</p>
                            <p className="text-white/60">{hashtags}</p>
                          </div>
                        </div>
                      )}

                      {activeTab === 'hooks' && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Marketing Hooks</h4>
                          <div className="space-y-2">
                            {derivedHooks.map((hook, i) => (
                              <div key={i} className="bg-background border border-white/5 p-3 text-sm font-light text-muted-foreground flex justify-between items-center group">
                                <span>{hook}</span>
                                <button onClick={() => copyToClipboard(hook, false)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Copy className="w-3 h-3 hover:text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <button 
                        onClick={() => generateMutation.mutate({ id: Number(id) })}
                        disabled={generateMutation.isPending}
                        className="py-3 border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-50"
                      >
                        {generateMutation.isPending ? "..." : "Regenerar"}
                      </button>
                      <button className="py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex justify-center items-center gap-2">
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
