import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Building, MapPin, List, CheckCircle2, User, Loader2, Upload, X } from "lucide-react";
import { useCreateListing } from "@/hooks/useListings";
import { apiClient } from "@/lib/apiClient";
import type { CreateListingInputListingType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";

// Define local zod schema matching CreateListingInput
const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  price: z.coerce.number().min(1, "El precio es requerido"),
  currency: z.string().default("MXN"),
  listingType: z.enum(["venta", "renta"]),
  propertyType: z.string().min(1, "Tipo requerido"),
  bedrooms: z.coerce.number().min(0),
  bathrooms: z.coerce.number().min(0),
  halfBathrooms: z.coerce.number().min(0).default(0),
  parkingSpots: z.coerce.number().min(0).default(0),
  floorLevel: z.coerce.number().min(0).optional(),
  floors: z.coerce.number().min(0).optional(),
  area: z.coerce.number().min(1, "Área requerida"),
  areaUnit: z.string().default("m2"),
  address: z.string().min(5, "Dirección requerida"),
  city: z.string().min(2, "Ciudad requerida"),
  state: z.string().min(2, "Estado requerido"),
  description: z.string().min(20, "Añade una descripción más detallada"),
  amenities: z.array(z.string()).default([]),
  images: z.string().optional(), // We'll parse this to array before submission
  agentName: z.string().min(2, "Nombre del agente requerido"),
  agentPhone: z.string().min(10, "Teléfono requerido"),
  agentEmail: z.string().email("Email inválido")
});

type FormValues = z.infer<typeof formSchema>;

const CURRENCIES = [
  { code: "USD", name: "Dólar estadounidense" },
  { code: "MXN", name: "Peso mexicano" },
  { code: "DOP", name: "Peso dominicano" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "Libra esterlina" },
  { code: "CAD", name: "Dólar canadiense" },
  { code: "AUD", name: "Dólar australiano" },
  { code: "CHF", name: "Franco suizo" },
  { code: "JPY", name: "Yen japonés" },
  { code: "CNY", name: "Yuan chino" },
  { code: "BRL", name: "Real brasileño" },
  { code: "ARS", name: "Peso argentino" },
  { code: "CLP", name: "Peso chileno" },
  { code: "COP", name: "Peso colombiano" },
  { code: "PEN", name: "Sol peruano" },
  { code: "UYU", name: "Peso uruguayo" },
  { code: "BOB", name: "Boliviano" },
  { code: "PYG", name: "Guaraní paraguayo" },
  { code: "VES", name: "Bolívar venezolano" },
  { code: "GTQ", name: "Quetzal guatemalteco" },
  { code: "HNL", name: "Lempira hondureño" },
  { code: "NIO", name: "Córdoba nicaragüense" },
  { code: "CRC", name: "Colón costarricense" },
  { code: "PAB", name: "Balboa panameño" },
  { code: "CUP", name: "Peso cubano" },
  { code: "HTG", name: "Gourde haitiano" },
  { code: "JMD", name: "Dólar jamaicano" },
  { code: "TTD", name: "Dólar de Trinidad" },
  { code: "SGD", name: "Dólar de Singapur" },
  { code: "HKD", name: "Dólar de Hong Kong" },
  { code: "KRW", name: "Won surcoreano" },
  { code: "INR", name: "Rupia india" },
  { code: "AED", name: "Dírham emiratí" },
  { code: "SAR", name: "Riyal saudí" },
  { code: "QAR", name: "Riyal catarí" },
  { code: "KWD", name: "Dinar kuwaití" },
  { code: "TRY", name: "Lira turca" },
  { code: "RUB", name: "Rublo ruso" },
  { code: "ZAR", name: "Rand sudafricano" },
  { code: "NGN", name: "Naira nigeriana" },
  { code: "EGP", name: "Libra egipcia" },
  { code: "MAD", name: "Dírham marroquí" },
];

const AMENITIES_LIST = [
  "Alberca", "Gimnasio", "Seguridad 24/7", "Estacionamiento",
  "Jardín", "Roof Garden", "Balcón", "Elevador",
  "Cuarto de servicio", "Casa Club", "Cancha de Tenis", "Cine"
];

const inputClasses = "w-full bg-background border border-white/10 text-foreground px-4 py-3 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all rounded-none placeholder:text-muted-foreground/50 font-light text-sm";
const labelClasses = "block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2";

export default function NewListing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadedPreviews, setUploadedPreviews] = useState<{url: string; name: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customAmenity, setCustomAmenity] = useState("");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currency: "MXN",
      listingType: "venta",
      propertyType: "Casa",
      areaUnit: "m2",
      amenities: [],
      bedrooms: 0,
      bathrooms: 0,
      halfBathrooms: 0,
      parkingSpots: 0,
      area: 0
    },
    mode: "onChange" // For real-time updates
  });

  const { watch, handleSubmit, formState: { errors }, setValue } = form;
  const formValues = watch();

  const createMutation = useCreateListing({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Listado Creado",
          description: "La propiedad se ha guardado exitosamente.",
        });
        setLocation("/listados");
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: "No se pudo crear el listado.",
          variant: "destructive",
        });
        console.error(err);
      }
    }
  });

  const onSubmit = (data: FormValues) => {
    // Transform images string to array
    const imagesArray = data.images 
      ? data.images.split(',').map(url => url.trim()).filter(Boolean)
      : [];

    createMutation.mutate({
      data: {
        ...data,
        images: imagesArray,
        listingType: data.listingType as CreateListingInputListingType
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const newPreviews: {url: string; name: string}[] = [];
      const newUrls: string[] = [];
      for (const file of files) {
        const { url } = await apiClient.uploadImage(file);
        newUrls.push(url);
        newPreviews.push({ url, name: file.name });
      }
      setUploadedPreviews(prev => [...prev, ...newPreviews]);
      const current = form.getValues("images") || "";
      const existing = current.split(",").map(s => s.trim()).filter(Boolean);
      form.setValue("images", [...existing, ...newUrls].join(", "));
      toast({ title: `${newUrls.length} imagen(es) subida(s)` });
    } catch {
      toast({ title: "Error al subir imagen", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeUploadedPreview = (url: string) => {
    setUploadedPreviews(prev => prev.filter(p => p.url !== url));
    const current = form.getValues("images") || "";
    const filtered = current.split(",").map(s => s.trim()).filter(s => s && s !== url);
    form.setValue("images", filtered.join(", "));
  };

  const toggleAmenity = (amenity: string) => {
    const current = formValues.amenities || [];
    if (current.includes(amenity)) {
      setValue("amenities", current.filter(a => a !== amenity), { shouldValidate: true });
    } else {
      setValue("amenities", [...current, amenity], { shouldValidate: true });
    }
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    const current = formValues.amenities || [];
    if (!current.includes(trimmed)) {
      setValue("amenities", [...current, trimmed], { shouldValidate: true });
    }
    setCustomAmenity("");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-4xl font-sans font-bold text-white mb-2 tracking-tight">Nuevo Listado</h1>
          <p className="text-muted-foreground font-light uppercase tracking-widest text-sm">Ingresa los detalles de la propiedad para generar su ficha premium.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Form Area */}
          <div className="lg:col-span-7 xl:col-span-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
              
              {/* Sección 1: Básico */}
              <section className="bg-[#111111] border border-white/10 p-8">
                <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                  <Building className="text-white w-5 h-5" />
                  <h2 className="text-xl font-sans font-bold text-white uppercase tracking-widest">Información Básica</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className={labelClasses}>Título del Listado</label>
                    <input {...form.register("title")} className={inputClasses} placeholder="Ej. Residencia Minimalista en el Bosque" />
                    {errors.title && <p className="text-destructive text-xs mt-2">{errors.title.message}</p>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClasses}>Operación</label>
                      <select {...form.register("listingType")} className={inputClasses}>
                        <option value="venta">Venta</option>
                        <option value="renta">Renta</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>Tipo de Propiedad</label>
                      <select {...form.register("propertyType")} className={inputClasses}>
                        <option value="Casa">Casa</option>
                        <option value="Departamento">Departamento</option>
                        <option value="Terreno">Terreno</option>
                        <option value="Penthouse">Penthouse</option>
                        <option value="Villa">Villa</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClasses}>Precio</label>
                      <input type="number" {...form.register("price")} className={inputClasses} placeholder="0" />
                      {errors.price && <p className="text-destructive text-xs mt-2">{errors.price.message}</p>}
                    </div>
                    <div>
                      <label className={labelClasses}>Moneda</label>
                      <select {...form.register("currency")} className={inputClasses}>
                        {CURRENCIES.map(c => (
                          <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sección 2: Detalles */}
              <section className="bg-[#111111] border border-white/10 p-8">
                <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                  <List className="text-white w-5 h-5" />
                  <h2 className="text-xl font-sans font-bold text-white uppercase tracking-widest">Características</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className={labelClasses}>Recámaras</label>
                    <input type="number" {...form.register("bedrooms")} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Baños Completos</label>
                    <input type="number" step="0.5" {...form.register("bathrooms")} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Medios Baños</label>
                    <input type="number" {...form.register("halfBathrooms")} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Parqueo</label>
                    <input type="number" {...form.register("parkingSpots")} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Área</label>
                    <input type="number" {...form.register("area")} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Unidad</label>
                    <select {...form.register("areaUnit")} className={inputClasses}>
                      <option value="m2">m²</option>
                      <option value="acres">acres</option>
                      <option value="hectáreas">ha</option>
                    </select>
                  </div>
                  {["Departamento", "Penthouse"].includes(formValues.propertyType) && (
                    <div>
                      <label className={labelClasses}>Nivel de Piso</label>
                      <input type="number" {...form.register("floorLevel")} className={inputClasses} placeholder="Ej. 5" />
                    </div>
                  )}
                  {["Casa", "Villa"].includes(formValues.propertyType) && (
                    <div>
                      <label className={labelClasses}>Pisos</label>
                      <input type="number" {...form.register("floors")} className={inputClasses} placeholder="Ej. 2" />
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <label className={labelClasses}>Descripción Manual (Opcional - Será mejorada con IA)</label>
                  <textarea 
                    {...form.register("description")} 
                    rows={4} 
                    className={inputClasses} 
                    placeholder="Describe los detalles arquitectónicos, acabados y ambiente..." 
                  />
                  {errors.description && <p className="text-destructive text-xs mt-2">{errors.description.message}</p>}
                </div>
              </section>

              {/* Sección 3: Ubicación */}
              <section className="bg-[#111111] border border-white/10 p-8">
                <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                  <MapPin className="text-white w-5 h-5" />
                  <h2 className="text-xl font-sans font-bold text-white uppercase tracking-widest">Ubicación</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className={labelClasses}>Dirección / Zona</label>
                    <input {...form.register("address")} className={inputClasses} placeholder="Ej. Lomas de Chapultepec, V Sección" />
                    {errors.address && <p className="text-destructive text-xs mt-2">{errors.address.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClasses}>Ciudad</label>
                      <input {...form.register("city")} className={inputClasses} />
                      {errors.city && <p className="text-destructive text-xs mt-2">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className={labelClasses}>Estado</label>
                      <input {...form.register("state")} className={inputClasses} />
                      {errors.state && <p className="text-destructive text-xs mt-2">{errors.state.message}</p>}
                    </div>
                  </div>
                </div>
              </section>

              {/* Sección 4: Amenidades */}
              <section className="bg-[#111111] border border-white/10 p-8">
                <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                  <CheckCircle2 className="text-white w-5 h-5" />
                  <h2 className="text-xl font-sans font-bold text-white uppercase tracking-widest">Amenidades</h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {AMENITIES_LIST.map(amenity => {
                    const isSelected = formValues.amenities?.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-4 py-3 text-sm text-left font-light transition-all border ${
                          isSelected
                            ? "bg-white/10 border-white text-white font-medium"
                            : "bg-background border-white/10 text-muted-foreground hover:border-white/30"
                        }`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                  {/* Amenidades personalizadas */}
                  {(formValues.amenities || []).filter(a => !AMENITIES_LIST.includes(a)).map(a => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className="px-4 py-3 text-sm text-left font-light transition-all border bg-white/10 border-white text-white font-medium flex items-center justify-between gap-2"
                    >
                      <span>{a}</span>
                      <X className="w-3 h-3 opacity-50 flex-shrink-0" />
                    </button>
                  ))}
                </div>

                {/* Agregar amenidad personalizada */}
                <div className="flex gap-2 mt-5">
                  <input
                    type="text"
                    value={customAmenity}
                    onChange={e => setCustomAmenity(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomAmenity(); } }}
                    placeholder="Otra amenidad..."
                    className={`${inputClasses} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={addCustomAmenity}
                    disabled={!customAmenity.trim()}
                    className="px-4 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    + Añadir
                  </button>
                </div>
              </section>

              {/* Sección 5: Media & Agente */}
              <section className="bg-[#111111] border border-white/10 p-8">
                <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                  <User className="text-white w-5 h-5" />
                  <h2 className="text-xl font-sans font-bold text-white uppercase tracking-widest">Datos y Media</h2>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={labelClasses}>Imágenes</label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors disabled:opacity-40"
                      >
                        {uploading
                          ? <><Loader2 className="w-3 h-3 animate-spin"/> Subiendo...</>
                          : <><Upload className="w-3 h-3"/> Subir desde PC</>
                        }
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    {uploadedPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {uploadedPreviews.map(p => (
                          <div key={p.url} className="relative group aspect-square">
                            <img src={p.url} alt={p.name} className="w-full h-full object-cover rounded border border-white/10"/>
                            <button
                              type="button"
                              onClick={() => removeUploadedPreview(p.url)}
                              className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-white"/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      {...form.register("images")}
                      rows={2}
                      className={inputClasses}
                      placeholder="https://ejemplo.com/img1.jpg, https://ejemplo.com/img2.jpg"
                    />
                    <p className="text-xs text-muted-foreground/50 mt-1">Pega URLs separadas por comas o sube archivos directamente.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClasses}>Nombre del Agente</label>
                    <input {...form.register("agentName")} className={inputClasses} />
                    {errors.agentName && <p className="text-destructive text-xs mt-2">{errors.agentName.message}</p>}
                  </div>
                  <div>
                    <label className={labelClasses}>Teléfono</label>
                    <input {...form.register("agentPhone")} className={inputClasses} />
                    {errors.agentPhone && <p className="text-destructive text-xs mt-2">{errors.agentPhone.message}</p>}
                  </div>
                  <div>
                    <label className={labelClasses}>Email</label>
                    <input type="email" {...form.register("agentEmail")} className={inputClasses} />
                    {errors.agentEmail && <p className="text-destructive text-xs mt-2">{errors.agentEmail.message}</p>}
                  </div>
                </div>
              </section>

              <button 
                type="submit" 
                disabled={createMutation.isPending}
                className="w-full py-5 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
              >
                {createMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                ) : (
                  "Publicar Listado"
                )}
              </button>
            </form>
          </div>

          {/* Live Preview Pane */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="sticky top-32">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Vista Previa en Vivo</h3>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
              
              <motion.div
                key={JSON.stringify(formValues)}
                initial={{ opacity: 0.8, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <PropertyCard 
                  previewMode={true}
                  listing={{
                    title: formValues.title || "Escribe un título...",
                    price: formValues.price || 0,
                    currency: formValues.currency,
                    listingType: formValues.listingType as any,
                    propertyType: formValues.propertyType,
                    bedrooms: formValues.bedrooms,
                    bathrooms: formValues.bathrooms,
                    area: formValues.area,
                    areaUnit: formValues.areaUnit,
                    city: formValues.city || "Ciudad",
                    state: formValues.state || "Estado",
                    images: formValues.images ? formValues.images.split(',').filter(Boolean) : []
                  }} 
                />
              </motion.div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
