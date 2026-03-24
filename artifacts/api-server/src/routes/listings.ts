import { Router, type IRouter } from "express";
import { db, listingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateListingBody,
  GetListingByIdParams,
  GenerateListingContentParams,
  DeleteListingParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/listings", async (req, res) => {
  try {
    const userId = req.isAuthenticated() ? req.user.id : null;
    const rows = await db.select().from(listingsTable).orderBy(listingsTable.createdAt);
    const listings = userId
      ? rows.filter(l => l.userId === userId || l.userId === null)
      : rows;
    res.json(listings.map(mapListing));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching listings" });
  }
});

router.post("/listings", async (req, res) => {
  try {
    const body = CreateListingBody.parse(req.body);
    const userId = req.isAuthenticated() ? req.user.id : null;

    const score = computeAttractivenessScore(body);
    const priceLevel = computePriceLevel(body.price);

    const [listing] = await db
      .insert(listingsTable)
      .values({
        userId: userId ?? undefined,
        title: body.title,
        price: String(body.price),
        currency: body.currency ?? "MXN",
        listingType: body.listingType,
        propertyType: body.propertyType,
        bedrooms: body.bedrooms,
        bathrooms: String(body.bathrooms),
        area: String(body.area),
        areaUnit: body.areaUnit ?? "m2",
        address: body.address,
        city: body.city,
        state: body.state,
        description: body.description,
        amenities: body.amenities ?? [],
        images: body.images ?? [],
        agentName: body.agentName,
        agentPhone: body.agentPhone,
        agentEmail: body.agentEmail,
        attractivenessScore: score,
        priceLevel,
      })
      .returning();
    res.status(201).json(mapListing(listing));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Error creating listing" });
  }
});

router.get("/listings/:id", async (req, res) => {
  try {
    const { id } = GetListingByIdParams.parse({ id: Number(req.params.id) });
    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json(mapListing(listing));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching listing" });
  }
});

router.delete("/listings/:id", async (req, res) => {
  try {
    const { id } = DeleteListingParams.parse({ id: Number(req.params.id) });
    const [deleted] = await db.delete(listingsTable).where(eq(listingsTable.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting listing" });
  }
});

router.post("/listings/:id/generate", async (req, res) => {
  try {
    const { id } = GenerateListingContentParams.parse({ id: Number(req.params.id) });
    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    const generatedDescription = generateDescription(listing);
    const instagramCaption = generateInstagramCaption(listing);

    await db.update(listingsTable)
      .set({ generatedDescription, instagramCaption })
      .where(eq(listingsTable.id, id));

    res.json({ description: generatedDescription, instagramCaption });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating content" });
  }
});

function computeAttractivenessScore(body: { amenities?: string[]; bedrooms: number; bathrooms: number; area: number; images?: string[] }): number {
  let score = 50;
  const amenities = body.amenities ?? [];
  score += Math.min(amenities.length * 5, 25);
  if (body.bedrooms >= 3) score += 5;
  if (body.bathrooms >= 2) score += 5;
  if (Number(body.area) >= 100) score += 5;
  if ((body.images ?? []).length > 0) score += 10;
  return Math.min(score, 100);
}

function computePriceLevel(price: number): string {
  const p = Number(price);
  if (p < 2000000) return "bajo";
  if (p < 8000000) return "promedio";
  return "alto";
}

function mapListing(l: typeof listingsTable.$inferSelect) {
  return {
    id: l.id,
    title: l.title,
    price: Number(l.price),
    currency: l.currency,
    listingType: l.listingType,
    propertyType: l.propertyType,
    bedrooms: l.bedrooms,
    bathrooms: Number(l.bathrooms),
    area: Number(l.area),
    areaUnit: l.areaUnit,
    address: l.address,
    city: l.city,
    state: l.state,
    description: l.description,
    amenities: (l.amenities as string[]) || [],
    images: (l.images as string[]) || [],
    agentName: l.agentName,
    agentPhone: l.agentPhone,
    agentEmail: l.agentEmail,
    generatedDescription: l.generatedDescription ?? null,
    instagramCaption: l.instagramCaption ?? null,
    attractivenessScore: l.attractivenessScore ?? null,
    priceLevel: l.priceLevel ?? null,
    createdAt: l.createdAt.toISOString(),
  };
}

function generateDescription(l: typeof listingsTable.$inferSelect): string {
  const price = Number(l.price).toLocaleString("es-MX");
  const amenitiesList = (l.amenities as string[]).join(", ");
  const typeLabel = l.listingType === "venta" ? "en venta" : "en renta";
  return `Descubre una oportunidad única de vivir en armonía con el lujo y la modernidad. Esta excepcional ${l.propertyType} ${typeLabel}, ubicada en el corazón de ${l.city}, ${l.state}, es una invitación a redefinir tu estilo de vida.

Con ${l.bedrooms} recámaras y ${l.bathrooms} baños distribuidos en ${Number(l.area).toLocaleString("es-MX")} ${l.areaUnit} de espacio cuidadosamente diseñado, cada rincón de esta propiedad ha sido concebido para brindar confort y elegancia sin igual.

${l.description}

${amenitiesList ? `Entre sus destacadas amenidades se encuentran: ${amenitiesList}. ` : ""}Ubicada en ${l.address}, esta residencia combina una localización privilegiada con acabados de primer nivel.

Precio: $${price} ${l.currency}${l.listingType === "renta" ? " / mes" : ""}

No pierdas la oportunidad de hacer tuyo este exclusivo espacio. Contacta a ${l.agentName} hoy mismo y da el primer paso hacia tu nuevo hogar de lujo.`;
}

function generateInstagramCaption(l: typeof listingsTable.$inferSelect): string {
  const price = Number(l.price).toLocaleString("es-MX");
  const typeLabel = l.listingType === "venta" ? "EN VENTA" : "EN RENTA";
  const amenities = (l.amenities as string[]).slice(0, 3).join(" • ");
  return `✨ ${l.title.toUpperCase()} ✨

${typeLabel} | ${l.city}, ${l.state}
$${price} ${l.currency}

${l.bedrooms} recámaras • ${l.bathrooms} baños • ${Number(l.area).toLocaleString("es-MX")} ${l.areaUnit}${amenities ? `\n${amenities}` : ""}

${l.description.slice(0, 120)}...

🏡 Una propiedad que eleva tu estilo de vida
📍 ${l.address}
📞 Contacto: ${l.agentPhone}

#BienesRaices #LuxuryRealEstate #${l.city.replace(/\s/g, "")} #PropiedadesDelujo #ListaPro #${l.propertyType.replace(/\s/g, "")}`;
}

export default router;
