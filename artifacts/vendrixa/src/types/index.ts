export type ListingType = "venta" | "renta";
export type PriceLevel = "bajo" | "promedio" | "alto";

export interface Listing {
  id: number;
  title: string;
  price: number;
  currency: string;
  listingType: ListingType;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  halfBathrooms?: number;
  parkingSpots?: number;
  floorLevel?: number;
  floors?: number;
  area: number;
  areaUnit: string;
  address: string;
  city: string;
  state: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  generatedDescription?: string;
  instagramCaption?: string;
  attractivenessScore?: number;
  priceLevel?: PriceLevel;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateListingInput {
  title: string;
  price: number;
  currency: string;
  listingType: ListingType;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  halfBathrooms?: number;
  parkingSpots?: number;
  floorLevel?: number;
  floors?: number;
  area: number;
  areaUnit: string;
  address: string;
  city: string;
  state: string;
  description: string;
  amenities?: string[];
  images?: string[];
  agentName: string;
  agentPhone: string;
  agentEmail: string;
}

export type CreateListingInputListingType = ListingType;

export interface AuthUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
}
