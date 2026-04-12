export interface VetClinic {
  id: string
  name: string
  address: string
  phone: string | null
  distance: number
  coords: [number, number]
  open: boolean | null
}

export interface MapboxSearchFeature {
  properties: {
    mapbox_id: string
    name: string
    full_address: string
    metadata?: {
      phone?: string
      open_hours?: {
        open_now?: boolean
      }
    }
  }
  geometry: {
    coordinates: [number, number]
  }
}

export interface MapboxSearchResponse {
  features: MapboxSearchFeature[]
}
