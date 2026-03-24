import { db, listingsTable } from "@workspace/db";

async function seed() {
  console.log("Seeding listings...");

  const existing = await db.select().from(listingsTable);
  if (existing.length > 0) {
    console.log(`Already have ${existing.length} listings, skipping seed.`);
    process.exit(0);
  }

  await db.insert(listingsTable).values([
    {
      title: "Penthouse Frente al Mar",
      price: "18500000",
      currency: "MXN",
      listingType: "venta",
      propertyType: "Penthouse",
      bedrooms: 4,
      bathrooms: "3.5",
      area: "380",
      areaUnit: "m2",
      address: "Paseo del Mar 142, Torre Oceánica PH",
      city: "Los Cabos",
      state: "Baja California Sur",
      description:
        "Exclusivo penthouse con vista panorámica al Mar de Cortés. Acabados de lujo europeos, terraza de 120 m2, jacuzzi privado y acceso directo a marina.",
      amenities: ["Jacuzzi privado", "Terraza 120m2", "Marina privada", "Concierge 24h", "Gimnasio", "Spa"],
      images: ["/images/placeholder-property.png"],
      agentName: "Carlos Mendoza",
      agentPhone: "+52 55 1234 5678",
      agentEmail: "carlos@listapro.mx",
    },
    {
      title: "Villa Contemporánea con Alberca",
      price: "8900000",
      currency: "MXN",
      listingType: "venta",
      propertyType: "Casa",
      bedrooms: 5,
      bathrooms: "4",
      area: "620",
      areaUnit: "m2",
      address: "Privada Las Arboledas 28",
      city: "Mérida",
      state: "Yucatán",
      description:
        "Villa contemporánea en privada de alta exclusividad. Diseño arquitectónico premiado, jardines tropicales, alberca desbordante y cocina gourmet profesional.",
      amenities: ["Alberca desbordante", "Jardín tropical", "Cocina gourmet", "Sala cine", "Seguridad 24h", "Cuarto de servicio"],
      images: ["/images/placeholder-property.png"],
      agentName: "Ana García",
      agentPhone: "+52 999 234 5678",
      agentEmail: "ana@listapro.mx",
    },
    {
      title: "Departamento Sky Floor",
      price: "65000",
      currency: "MXN",
      listingType: "renta",
      propertyType: "Departamento",
      bedrooms: 2,
      bathrooms: "2",
      area: "145",
      areaUnit: "m2",
      address: "Torre Artz Pedregal, Piso 38",
      city: "Ciudad de México",
      state: "CDMX",
      description:
        "Sofisticado departamento en uno de los rascacielos más icónicos de la CDMX. Vistas 360° de la ciudad, acabados de importación y amenidades de clase mundial.",
      amenities: ["Vistas 360°", "Roof garden", "Business center", "Valet parking", "Pet friendly", "Gym & spa"],
      images: ["/images/placeholder-property.png"],
      agentName: "Roberto Silva",
      agentPhone: "+52 55 9876 5432",
      agentEmail: "roberto@listapro.mx",
    },
  ]);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
