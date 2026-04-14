export interface VetFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    mapbox_id: string;
    name: string;
    full_address: string;
    metadata?: {
      phone?: string;
      open_hours?: {
        open_now: boolean;
      };
    };
  };
}

export interface MapboxSearchResponse {
  type: 'FeatureCollection';
  features: VetFeature[];
}

export interface VetClinic {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  distance: number;
  coords: [number, number]; // [lng, lat]
  open: boolean | null;
}