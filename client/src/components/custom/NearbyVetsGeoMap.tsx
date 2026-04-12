import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { VetClinic, MapboxSearchResponse, MapboxSearchFeature } from './types/vet';

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
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const userDot = document.createElement('div');
    userDot.style.cssText = `
      width: 16px; height: 16px; background: #185FA5;
      border: 3px solid white; border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(24,95,165,0.25);
    `;
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
      el.style.cssText = `
        width: 32px; height: 32px; background-color: #2D5CF3;
        border: 2px solid white; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
      `;
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="16" height="16" fill="#ffffff"><path d="M298.5 156.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5M164.4 262.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3s-14.3-70.1 10.2-84.1s59.7.9 78.5 33.3m-31.2 202.6C185.6 323.9 278.7 288 320 288s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2c-25.8 0-46.7-20.9-46.7-46.7v-1.6c0-10.4 1.6-20.8 5.2-30.5m352.6-118.5c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3m-111.7-93c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5"/></svg>`;

      new mapboxgl.Marker(el)
        .setLngLat(vet.coords)
        .setPopup(
          new mapboxgl.Popup({ offset: 20 }).setHTML(`
            <strong style="font-size:13px">${vet.name}</strong><br/>
            <span style="font-size:12px;color:#555">${vet.address}</span><br/>
            <span style="font-size:12px">${vet.distance.toFixed(1)} km away</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div ref={mapContainer} style={{ flex: '0 0 55%' }} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: '#f9f9f9' }}>
        {loading && <p style={{ color: '#888', fontSize: 14 }}>Finding clinics near you...</p>}
        {error && <p style={{ color: '#c0392b', fontSize: 14 }}>{error}</p>}

        {vets.map((vet) => (
          <div
            key={vet.id}
            onClick={() => flyToVet(vet)}
            style={{
              background: 'white',
              border: selected === vet.id ? '1.5px solid #0F6E56' : '1px solid #e0e0e0',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 10,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{vet.name}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#777' }}>{vet.address}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                {vet.open === true && (
                  <span style={{ fontSize: 11, background: '#EAF3DE', color: '#3B6D11', padding: '2px 8px', borderRadius: 20 }}>Open</span>
                )}
                {vet.open === false && (
                  <span style={{ fontSize: 11, background: '#FCEBEB', color: '#A32D2D', padding: '2px 8px', borderRadius: 20 }}>Closed</span>
                )}
                <span style={{ fontSize: 12, color: '#999' }}>{vet.distance.toFixed(1)} km</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12 }}>
              {vet.phone && (
                <a
                  href={`tel:${vet.phone}`}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
                  style={{ fontSize: 12, color: '#0F6E56', textDecoration: 'none', fontWeight: 500 }}
                >
                  Call
                </a>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${vet.coords[1]},${vet.coords[0]}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
                style={{ fontSize: 12, color: '#185FA5', textDecoration: 'none', fontWeight: 500 }}
              >
                Directions
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}