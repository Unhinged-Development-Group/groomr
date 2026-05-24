export interface GroomerResult {
  id: string;
  name: string;
  tagline?: string;
  bio?: string;
  image: string;
  rating: number;
  reviewCount: number;
  distance?: number;
  location: string;
  priceFrom?: number;
  requiresDeposit: boolean;
  depositType: 'none' | 'percentage' | 'full';
  depositPercentage: number | null;
  serviceNames: string[];
  isVerified: boolean;
  lat?: number;
  lng?: number;
}

export interface SearchParams {
  q?: string;
  lat?: string;
  lng?: string;
  service?: string;
  price?: string;
  payment?: string;
  rating?: string;
  verified?: string;
}

export interface ActiveFilters {
  service: string;
  price: string;
  payment: string;
  rating: string;
  verified: string;
}

export type SortOption = 'rating' | 'az' | 'price' | 'distance';

export interface MapCentre {
  lat: number;
  lng: number;
}
