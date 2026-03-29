import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Bed, Bath, Maximize, MapPin, Sparkles,
  Copy, Download, Check, Instagram, Phone, Mail,
  Image as ImageIcon, Video, Loader2, Share2
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  useGetListingById,
  useGenerateListingContent,
  getGetListingByIdQueryKey
} from "@/hooks/useListings";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import PropertyMap from "@/components/PropertyMap";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [copiedDesc, setCopiedDesc]   = useState(false);
  const [copiedIg,   setCopiedIg]     = useState(false);
  const [activeTab,  setActiveTab]    = useState<"desc" | "ig" | "hooks" | "imagen" | "video">("desc");
  const [imgPreviewSrc, setImgPreviewSrc] = useState<string | null>(null);
  const [igPublishing,    setIgPublishing]    = useState(false);
  const [videoPublishing, setVideoPublishing] = useState(false);
  const [videoPolling,   setVideoPolling]   = useState(false);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const [igImgLoading,   setIgImgLoading]   = useState(false);

  // Publica imagen en Instagram
  const publishMutation = useMutation({
    mutationFn: () => apiClient.post(`/listings/${id}/instagram/publish`, {}),
    onSuccess: () => {
      toast({ title: "Imagen publicada en Instagram", description: "Post enviado exitosamente." });
      setIgPublishing(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Error al publicar";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setIgPublishing(false);
    },
  });

  // Publica video en Instagram
  const videoPublishMutation = useMutation({
    mutationFn: () => apiClient.post(`/listings/${id}/video/instagram/publish`, {}),
    onSuccess: () => {
      toast({ title: "Reel publicado en Instagram", description: "Video enviado exitosamente." });
      setVideoPublishing(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Error al publicar";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setVideoPublishing(false);
    },
  });

  // Genera video
  const videoMutation = useMutation({
    mutationFn: () => apiClient.post<{ status: string; progress: number }>(`/listings/${id}/video/generate`, {}),
    onSuccess: () => setVideoPolling(true),
    onError: () => toast({ title: "Error", description: "No se pudo iniciar el render.", variant: "destructive" }),
  });

  // Polling del estado del video
  const { data: videoStatus } = useQuery({
    queryKey: ["video-status", id],
    queryFn:  () => apiClient.get<{ status: string; progress: number; error?: string }>(`/listings/${id}/video/status`),
    enabled:  videoPolling,
    refetchInterval: videoPolling ? 2000 : false,
  });

  useEffect(() => {
    if (videoStatus?.status === "done" || videoStatus?.status === "error") {
      setVideoPolling(false);
      if (videoStatus.status === "done") {
        toast({ title: "Video listo", description: "Haz clic en Descargar Video." });
      } else {
        toast({ title: "Error en video", description: videoStatus.error ?? "Error desconocido", variant: "destructive" });
      }
    }
  }, [videoStatus]);

  const handleGenerateImage = async () => {
    setIgImgLoading(true);
    try {
      const r = await fetch(`/api/listings/${id}/image/instagram`);
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const blob = await r.blob();
      setImgPreviewSrc(URL.createObjectURL(blob));
    } catch {
      toast({ title: "Error", description: "No se pudo generar la imagen.", variant: "destructive" });
    } finally {
      setIgImgLoading(false);
    }
  };

  const handleGenerateAll = () => {
    generateMutation.mutate({ id: Number(id) });
    handleGenerateImage();
    videoMutation.mutate();
  };

  const handlePublishAll = () => {
    setIgPublishing(true);
    publishMutation.mutate();
    setVideoPublishing(true);
    videoPublishMutation.mutate();
  };

  const downloadBlob = async (
    url: string,
    filename: string,
    setLoading: (v: boolean) => void,
  ) => {
    setLoading(true);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const blob = await r.blob();
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      toast({ title: "Error", description: "No se pudo descargar el archivo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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

  const anyGenerating = generateMutation.isPending || igImgLoading || videoMutation.isPending || videoPolling;
  const anyPublishing = igPublishing || publishMutation.isPending || videoPublishing || videoPublishMutation.isPending;

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
            <div className="sticky top-24">
              <div className="bg-[#111111] border border-white/10 p-8 shadow-xl max-h-[calc(100vh-7rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-white" />
                    <h2 className="text-2xl font-sans font-bold text-white tracking-tight">AI Content Studio</h2>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground font-light mb-8 leading-relaxed">
                  Utiliza inteligencia artificial para redactar descripciones magnéticas y contenido para redes sociales basado en los datos de la propiedad.
                </p>

                {/* Botón Generar Todo — siempre visible */}
                <button
                  onClick={handleGenerateAll}
                  disabled={anyGenerating}
                  className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest flex justify-center items-center gap-3 hover:bg-gray-200 transition-all disabled:opacity-50 mb-6"
                >
                  {anyGenerating
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Generando todo...</>
                    : <><Sparkles className="w-5 h-5" /> Generar Todo</>}
                </button>

                {(listing.generatedDescription || listing.instagramCaption) && (
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
                      <button
                        onClick={() => setActiveTab("imagen")}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 flex items-center gap-1 ${activeTab === 'imagen' ? 'border-white text-white' : 'border-transparent text-muted-foreground hover:text-white'}`}
                      >
                        <ImageIcon className="w-3 h-3" /> Imagen
                      </button>
                      <button
                        onClick={() => setActiveTab("video")}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 flex items-center gap-1 ${activeTab === 'video' ? 'border-white text-white' : 'border-transparent text-muted-foreground hover:text-white'}`}
                      >
                        <Video className="w-3 h-3" /> Video
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
                          <button
                            onClick={() => generateMutation.mutate({ id: Number(id) })}
                            disabled={generateMutation.isPending}
                            className="mt-3 w-full py-2 border border-white/10 text-muted-foreground text-xs font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                          >
                            {generateMutation.isPending ? "Regenerando..." : "Regenerar"}
                          </button>
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
                          <button
                            onClick={() => generateMutation.mutate({ id: Number(id) })}
                            disabled={generateMutation.isPending}
                            className="w-full py-2 border border-white/10 text-muted-foreground text-xs font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                          >
                            {generateMutation.isPending ? "Regenerando..." : "Regenerar"}
                          </button>
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
                          <button
                            onClick={() => generateMutation.mutate({ id: Number(id) })}
                            disabled={generateMutation.isPending}
                            className="mt-3 w-full py-2 border border-white/10 text-muted-foreground text-xs font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                          >
                            {generateMutation.isPending ? "Regenerando..." : "Regenerar"}
                          </button>
                        </div>
                      )}

                      {activeTab === 'imagen' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Imagen Instagram 1080×1080</h4>
                          {!imgPreviewSrc && !igImgLoading && (
                            <button
                              onClick={handleGenerateImage}
                              className="w-full py-3 border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors flex justify-center items-center gap-2"
                            >
                              <ImageIcon className="w-4 h-4" /> Generar Imagen
                            </button>
                          )}
                          {igImgLoading && (
                            <div className="flex justify-center items-center py-12">
                              <Loader2 className="w-6 h-6 animate-spin text-white" />
                              <span className="ml-3 text-sm text-muted-foreground">Generando imagen...</span>
                            </div>
                          )}
                          {imgPreviewSrc && (
                            <>
                              <div className="border border-white/10 overflow-hidden">
                                <img src={imgPreviewSrc} alt="Vista previa Instagram" className="w-full aspect-square object-cover" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => downloadBlob(`/api/listings/${id}/image/instagram`, `instagram-${id}.jpg`, setIgImgLoading)}
                                  disabled={igImgLoading}
                                  className="py-3 border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
                                >
                                  {igImgLoading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                                    : <><Download className="w-4 h-4" /> Descargar</>}
                                </button>
                                <button
                                  onClick={() => { setIgPublishing(true); publishMutation.mutate(); }}
                                  disabled={igPublishing || publishMutation.isPending}
                                  className="py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                  {igPublishing
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
                                    : <><Share2 className="w-4 h-4" /> Publicar IG</>}
                                </button>
                              </div>
                              <button
                                onClick={handleGenerateImage}
                                disabled={igImgLoading}
                                className="w-full py-2 border border-white/10 text-muted-foreground text-xs font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                              >
                                {igImgLoading ? "Regenerando..." : "Regenerar"}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {activeTab === 'video' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Video Reel</h4>
                          {videoStatus?.status === "done" ? (
                            <>
                              <div className="border border-white/10 overflow-hidden bg-black">
                                <video
                                  src={`/api/listings/${id}/video`}
                                  controls
                                  className="w-full"
                                />
                              </div>
                              {shortCaption && (
                                <div className="bg-background border border-white/5 p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Caption Short</p>
                                  <p className="text-sm font-light text-white/80 leading-relaxed">{shortCaption}</p>
                                  <button
                                    onClick={() => copyToClipboard(shortCaption, false)}
                                    className="mt-2 text-[10px] text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
                                  >
                                    <Copy className="w-3 h-3" /> Copiar
                                  </button>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => downloadBlob(`/api/listings/${id}/video`, `reel-${id}.mp4`, () => {})}
                                  className="py-3 border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors flex justify-center items-center gap-2"
                                >
                                  <Download className="w-4 h-4" /> Descargar
                                </button>
                                <button
                                  onClick={() => { setVideoPublishing(true); videoPublishMutation.mutate(); }}
                                  disabled={videoPublishing || videoPublishMutation.isPending}
                                  className="py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                  {videoPublishing
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
                                    : <><Share2 className="w-4 h-4" /> Publicar Reel</>}
                                </button>
                              </div>
                              <button
                                onClick={() => videoMutation.mutate()}
                                disabled={videoPolling || videoMutation.isPending}
                                className="w-full py-2 border border-white/10 text-muted-foreground text-xs font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                              >
                                {videoPolling || videoMutation.isPending ? "Iniciando render..." : "Regenerar"}
                              </button>
                            </>
                          ) : (
                            <>
                              {(videoPolling || videoStatus?.status === "rendering") && (
                                <div className="border border-white/5 bg-background p-6 flex flex-col items-center gap-3">
                                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                                  <p className="text-sm text-muted-foreground">Renderizando video...</p>
                                  <div className="w-full h-1 bg-white/10 overflow-hidden">
                                    <div
                                      className="h-full bg-white transition-all duration-500"
                                      style={{ width: `${videoStatus?.progress ?? 0}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">{videoStatus?.progress ?? 0}%</p>
                                </div>
                              )}
                              {!videoPolling && videoStatus?.status !== "rendering" && (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                  El video aún no ha sido generado.
                                </p>
                              )}
                              <button
                                onClick={() => videoMutation.mutate()}
                                disabled={videoPolling || videoMutation.isPending}
                                className="w-full py-3 border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                              >
                                {videoPolling || videoMutation.isPending
                                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando render...</>
                                  : <><Video className="w-4 h-4" /> Generar Video Reel</>}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleGenerateAll}
                          disabled={anyGenerating}
                          className="py-3 border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                          {anyGenerating
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                            : "Regenerar Todo"}
                        </button>
                        <button
                          onClick={() => downloadBlob(`/api/listings/${id}/pdf`, `propiedad-${id}.pdf`, setPdfLoading)}
                          disabled={pdfLoading}
                          className="py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
                        >
                          {pdfLoading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                            : <><Download className="w-4 h-4" /> PDF</>}
                        </button>
                      </div>
                      <button
                        onClick={handlePublishAll}
                        disabled={anyPublishing}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
                      >
                        {anyPublishing
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
                          : <><Share2 className="w-4 h-4" /> Publicar Todo (Foto + Video)</>}
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
