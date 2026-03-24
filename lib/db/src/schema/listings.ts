import { pgTable, text, serial, numeric, integer, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  title: text("title").notNull(),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MXN"),
  listingType: text("listing_type").notNull(),
  propertyType: text("property_type").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: numeric("bathrooms", { precision: 4, scale: 1 }).notNull(),
  area: numeric("area", { precision: 12, scale: 2 }).notNull(),
  areaUnit: text("area_unit").notNull().default("m2"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  description: text("description").notNull(),
  amenities: jsonb("amenities").$type<string[]>().notNull().default([]),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  agentName: text("agent_name").notNull(),
  agentPhone: text("agent_phone").notNull(),
  agentEmail: text("agent_email").notNull(),
  generatedDescription: text("generated_description"),
  instagramCaption: text("instagram_caption"),
  attractivenessScore: integer("attractiveness_score"),
  priceLevel: text("price_level"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
