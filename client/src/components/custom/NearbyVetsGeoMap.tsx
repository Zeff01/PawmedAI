import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { VetClinic, MapboxSearchResponse, MapboxSearchFeature } from './types/vet';
import { Card } from '@/components/ui/card';
import { Phone, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export default function NearbyVetsGeoMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [vets, setVets] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }: GeolocationPosition) =>
        initMap(coords.latitude, coords.longitude),
      () => setError('Location access denied. Please enable it in your browser settings.')
    );
  }, []);

  function initMap(lat: number, lng: number): void {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/jpdevdotcom/cmnv70588005601svfx2i0fff',
      center: [lng, lat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const userDot = document.createElement('div');
    userDot.className = 'size-4 rounded-full border-[3px] border-white bg-[#185FA5] shadow-[0_0_0_4px_rgba(24,95,165,0.25)]';
    new mapboxgl.Marker(userDot).setLngLat([lng, lat]).addTo(map.current);

    searchNearbyVets(lat, lng);
  }

  async function searchNearbyVets(lat: number, lng: number): Promise<void> {
    setLoading(true);
    try {
      const url = new URL('https://api.mapbox.com/search/searchbox/v1/category/veterinarian');
      url.searchParams.set('proximity', `${lng},${lat}`);
      url.searchParams.set('limit', '10');
      url.searchParams.set('language', 'en');
      url.searchParams.set('access_token', mapboxgl.accessToken as string);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Mapbox API error: ${res.status}`);

      const data: MapboxSearchResponse = await res.json();

      if (!data.features.length) {
        setError('No veterinary clinics found nearby.');
        return;
      }

      const results: VetClinic[] = data.features
        .map((f: MapboxSearchFeature) => ({
          id: f.properties.mapbox_id,
          name: f.properties.name,
          address: f.properties.full_address,
          phone: f.properties.metadata?.phone ?? null,
          distance: getDistanceKm(
            lat, lng,
            f.geometry.coordinates[1],
            f.geometry.coordinates[0]
          ),
          coords: f.geometry.coordinates,
          open: f.properties.metadata?.open_hours?.open_now ?? null,
        }))
        .sort((a: VetClinic, b: VetClinic) => a.distance - b.distance);

      setVets(results);
      addVetMarkers(results);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load nearby clinics.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function addVetMarkers(results: VetClinic[]): void {
    if (!map.current) return;

    results.forEach((vet) => {
      const el = document.createElement('div');
      el.className = 'flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#2D5CF3] shadow-md';
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="16" height="16" fill="#ffffff"><path d="M298.5 156.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5M164.4 262.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3s-14.3-70.1 10.2-84.1s59.7.9 78.5 33.3m-31.2 202.6C185.6 323.9 278.7 288 320 288s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2c-25.8 0-46.7-20.9-46.7-46.7v-1.6c0-10.4 1.6-20.8 5.2-30.5m352.6-118.5c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3m-111.7-93c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5"/></svg>`;

      new mapboxgl.Marker(el)
        .setLngLat(vet.coords)
        .setPopup(
          new mapboxgl.Popup({ offset: 20 }).setHTML(`
            <strong class="text-sm font-semibold text-blue-500">${vet.name}</strong><br/>
            <span class="text-xs text-muted-foreground">${vet.address}</span><br/>
            <span class="text-xs">${vet.distance.toFixed(1)} km away</span>
          `)
        )
        .addTo(map.current!);
    });
  }

  function flyToVet(vet: VetClinic): void {
    if (!map.current) return;
    setSelected(vet.id);
    map.current.flyTo({ center: vet.coords, zoom: 16, duration: 800 });
  }

  function getDistanceKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  return (
    <div className="flex flex-col gap-12">
      <div ref={mapContainer} className="h-96 shrink-0 rounded-2xl" />

      <div className="space-y-4 bg-white">
        {/* Section header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-bold text-xl text-blue-500">Clinics Near You</h2>
            <p className="text-muted-foreground text-sm">Sorted by distance from your current location.</p>
          </div>
          {!loading && !error && vets.length > 0 && (
            <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
              {vets.length} found
            </span>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
            Searching for clinics near you…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {vets.map((vet) => (
            <Card
              key={vet.id}
              onClick={() => flyToVet(vet)}
              className={cn(
                'cursor-pointer p-4 transition-all border border-blue-100 rounded-xl hover:border-blue-200',
                selected === vet.id && 'ring-1 ring-blue-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{vet.name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{vet.address}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{vet.distance.toFixed(1)} km</span>
                  </div>
                </div>

                <div className="ml-4 flex shrink-0 flex-col gap-2">
                  {vet.phone && (
                    <a
                      href={`tel:${vet.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      <Phone className="size-3.5" />
                      Call
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${vet.coords[1]},${vet.coords[0]}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Navigation className="size-3.5" />
                    Directions
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
