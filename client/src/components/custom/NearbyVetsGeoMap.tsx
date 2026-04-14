import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { VetClinic, MapboxSearchResponse, MapboxSearchFeature } from './types/vet';
import { Card } from '@/components/ui/card';
import { Phone, Navigation, MapPin, LocateFixed, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

// Round the Mapbox popup globally
const popupStyle = document.createElement('style');
popupStyle.textContent = `.mapboxgl-popup-content { border-radius: 16px !important; padding: 16px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important; }`;
document.head.appendChild(popupStyle);

// Consistent avatar colour per clinic (based on name hash)
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ── Skeleton card ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3.5 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-1/4 rounded bg-slate-100" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-lg bg-slate-100" />
        <div className="h-8 flex-1 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

// ── Location-denied empty state ────────────────────────────────
function LocationDenied() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-400">
        <MapPin className="h-7 w-7" />
      </span>
      <div>
        <p className="font-semibold text-slate-800">Location access denied</p>
        <p className="mt-1 text-sm text-slate-500">
          To find clinics near you, allow location access in your browser.
        </p>
      </div>
      <ol className="text-left text-xs text-slate-400 space-y-1 list-decimal list-inside">
        <li>Click the lock / info icon in the address bar</li>
        <li>Set <span className="font-medium text-slate-600">Location</span> to <span className="font-medium text-slate-600">Allow</span></li>
        <li>Refresh this page</li>
      </ol>
    </div>
  );
}

// ── User marker HTML ───────────────────────────────────────────
function createUserMarkerEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;border:3px solid white;background:#185FA5;box-shadow:0 0 0 4px rgba(24,95,165,0.25)">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
    </div>
    <span style="background:#185FA5;color:white;font-size:10px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:2px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15)">You are here</span>
  `;
  return el;
}

export default function NearbyVetsGeoMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const vetMarkers = useRef<mapboxgl.Marker[]>([]);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [vets, setVets] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [relocating, setRelocating] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }: GeolocationPosition) => {
        setUserCoords([coords.latitude, coords.longitude]);
        initMap(coords.latitude, coords.longitude);
        reverseGeocode(coords.latitude, coords.longitude);
      },
      () => {
        setLocationDenied(true);
        setLoading(false);
      }
    );
  }, []);

  async function reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const url = new URL('https://api.mapbox.com/search/geocode/v6/reverse');
      url.searchParams.set('longitude', String(lng));
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('language', 'en');
      url.searchParams.set('access_token', mapboxgl.accessToken as string);

      const res = await fetch(url.toString());
      if (!res.ok) return;

      const data = await res.json();
      const place = data.features?.[0]?.properties?.full_address;
      if (place) setUserAddress(place);
    } catch {
      // silently fail — address is not critical
    }
  }

  function initMap(lat: number, lng: number): void {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/jpdevdotcom/cmnv70588005601svfx2i0fff',
      center: [lng, lat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    userMarker.current = new mapboxgl.Marker(createUserMarkerEl())
      .setLngLat([lng, lat])
      .addTo(map.current);

    searchNearbyVets(lat, lng);
  }

  // ── Relocate: re-fetch GPS, move marker, refresh clinics ────
  const handleRelocate = useCallback(() => {
    setRelocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      ({ coords }: GeolocationPosition) => {
        const { latitude: lat, longitude: lng } = coords;
        setUserCoords([lat, lng]);
        reverseGeocode(lat, lng);

        // Move the user marker
        if (userMarker.current) {
          userMarker.current.setLngLat([lng, lat]);
        }

        // Re-center map
        if (map.current) {
          map.current.flyTo({ center: [lng, lat], zoom: 13, duration: 1000 });
        }

        // Remove old vet markers
        vetMarkers.current.forEach((m) => m.remove());
        vetMarkers.current = [];

        // Clear state and search again
        setSelected(null);
        setVets([]);
        searchNearbyVets(lat, lng).finally(() => setRelocating(false));
      },
      () => {
        setError('Could not refresh location. Please check your browser settings.');
        setRelocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

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

    // Clear existing vet markers
    vetMarkers.current.forEach((m) => m.remove());
    vetMarkers.current = [];

    results.forEach((vet, index) => {
      const el = document.createElement('div');
      el.className =
        'flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#2D5CF3] shadow-md text-white text-[11px] font-bold';
      if (index === 0) {
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="16" height="16" fill="#ffffff"><path d="M298.5 156.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5M164.4 262.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3s-14.3-70.1 10.2-84.1s59.7.9 78.5 33.3m-31.2 202.6C185.6 323.9 278.7 288 320 288s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2c-25.8 0-46.7-20.9-46.7-46.7v-1.6c0-10.4 1.6-20.8 5.2-30.5m352.6-118.5c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3m-111.7-93c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5"/></svg>`;
      } else {
        el.textContent = String(index + 1);
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(vet.coords)
        .setPopup(
          new mapboxgl.Popup({ offset: 20, maxWidth: '260px', closeButton: false }).setHTML(
            `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:4px 2px;min-width:200px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#2D5CF3;color:#fff;font-size:11px;font-weight:700;flex-shrink:0">
                  ${index + 1}
                </div>
                <span style="font-size:13px;font-weight:700;color:#0f172a;line-height:1.3">${vet.name}</span>
              </div>
              <div style="height:1px;background:#f1f5f9;margin-bottom:8px"></div>
              <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:6px">
                <svg style="flex-shrink:0;margin-top:1px" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style="font-size:11px;color:#64748b;line-height:1.4">${vet.address}</span>
              </div>
              <div style="display:inline-flex;align-items:center;gap:4px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;padding:2px 8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2D5CF3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                <span style="font-size:11px;font-weight:600;color:#2D5CF3">${vet.distance.toFixed(1)} km away</span>
              </div>
            </div>`
          )
        )
        .addTo(map.current!);

      vetMarkers.current.push(marker);

      el.addEventListener('click', () => {
        setSelected(vet.id);
        setTimeout(() => {
          cardRefs.current[vet.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      });
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
    <div className="flex flex-col gap-10">
      {/* User location bar + refresh button */}
      {userAddress && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#185FA5] shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">Your current location</p>
            <p className="truncate text-sm text-slate-700">{userAddress}</p>
          </div>
          <button
            onClick={handleRelocate}
            disabled={relocating}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 shadow-sm hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {relocating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Locating…
              </>
            ) : (
              <>
                <LocateFixed className="size-3.5" />
                Refresh location
              </>
            )}
          </button>
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <div ref={mapContainer} className="h-96 shrink-0 rounded-2xl" />

        {/* My Location button overlaid on map (bottom-left) */}
        {map.current && !locationDenied && (
          <button
            onClick={handleRelocate}
            disabled={relocating}
            title="Re-center on my location"
            className="absolute bottom-4 left-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-md hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {relocating ? (
              <Loader2 className="size-4 animate-spin text-blue-600" />
            ) : (
              <LocateFixed className="size-4 text-blue-600" />
            )}
          </button>
        )}
      </div>

      <div className="space-y-4 bg-white">
        {/* Section header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-bold text-xl text-blue-500">Clinics Near You</h2>
            <p className="text-muted-foreground text-sm">Sorted by distance from your current location.</p>
          </div>
          {!loading && !locationDenied && !error && vets.length > 0 && (
            <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
              {vets.length} found
            </span>
          )}
        </div>

        {/* Location denied */}
        {locationDenied && <LocationDenied />}

        {/* Generic error */}
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Skeleton loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Clinic cards */}
        {!loading && vets.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {vets.map((vet, index) => (
              <Card
                key={vet.id}
                ref={(el) => { cardRefs.current[vet.id] = el as HTMLDivElement | null; }}
                onClick={() => flyToVet(vet)}
                className={cn(
                  'cursor-pointer p-4 transition-all shadow-none border border-blue-100 rounded-xl hover:border-blue-300 hover:shadow-sm',
                  selected === vet.id && 'ring-2 ring-blue-300 border-blue-300 bg-blue-50/40'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      avatarColor(vet.name)
                    )}>
                      {initials(vet.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="truncate text-sm font-semibold text-slate-800 leading-tight">
                          {vet.name}
                        </p>
                        <span className="shrink-0 ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                          {index + 1}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {vet.address}
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        <MapPin className="size-2.5" />
                        {vet.distance.toFixed(1)} km away
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full">
                    {vet.phone ? (
                      <a
                        href={`tel:${vet.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                      >
                        <Phone className="size-3.5" />
                        Call
                      </a>
                    ) : (
                      <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-300 cursor-not-allowed select-none">
                        <Phone className="size-3.5" />
                        No phone listed
                      </span>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1${userCoords ? `&origin=${userCoords[0]},${userCoords[1]}` : ''}&destination=${encodeURIComponent(vet.name + ' ' + vet.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <Navigation className="size-3.5" />
                      Directions
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
