export interface GroomerResult {
  id: string;
  name: string;
  tagline?: string;
  image: string;
  rating: number;
  reviewCount: number;
  distance?: number;
  location: string;
  priceFrom?: number;
  requiresDeposit: boolean;
  serviceNames: string[];
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
}

export interface ActiveFilters {
  service: string;
  price: string;
  payment: string;
  rating: string;
}

export interface MapCentre {
  lat: number;
  lng: number;
}
