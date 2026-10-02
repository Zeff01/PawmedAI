import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type {
  VetClinic,
  MapboxSearchResponse,
  MapboxSearchFeature,
} from './types/vet'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Phone,
  Navigation,
  MapPin,
  LocateFixed,
  Loader2,
  Lock,
  Search,
  Car,
  Footprints,
  X,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AuthModal } from '@/components/AuthModal'
import { useSupabaseSession } from '@/hooks/useAuth'

/**
 * How many clinics a signed-out visitor sees.
 *
 * Enough to prove the locator works and to help someone with an emergency on
 * their hands, but the full list is what an account is for.
 */
const PREVIEW_LIMIT = 2

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string

// Round the Mapbox popup globally
const popupStyle = document.createElement('style')
popupStyle.textContent = `.mapboxgl-popup-content { border-radius: 16px !important; padding: 16px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important; }`
document.head.appendChild(popupStyle)

// Consistent avatar colour per clinic (based on name hash)
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
function initials(name: string) {
  const words = name.trim().split(/\s+/)
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
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
  )
}

// ── Map skeleton (shown until tiles finish rendering) ──────────
function MapSkeleton() {
  return (
    <div className="absolute inset-0 z-20 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-blue-500" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Loading map…
        </p>
      </div>
    </div>
  )
}

// ── Manual location fallback ───────────────────────────────────
type PlaceSuggestion = { name: string; lat: number; lng: number }

async function forwardGeocode(query: string): Promise<PlaceSuggestion[]> {
  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '5')
  url.searchParams.set('language', 'en')
  url.searchParams.set('access_token', mapboxgl.accessToken as string)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Mapbox geocoding error: ${res.status}`)

  const data = await res.json()
  return (data.features ?? [])
    .map(
      (f: {
        properties?: { full_address?: string; name?: string }
        geometry?: { coordinates?: [number, number] }
      }) => {
        const coords = f.geometry?.coordinates
        const name = f.properties?.full_address ?? f.properties?.name
        if (!coords || !name) return null
        return { name, lat: coords[1], lng: coords[0] }
      },
    )
    .filter((p: PlaceSuggestion | null): p is PlaceSuggestion => p !== null)
}

function LocationSearch({
  onPick,
  label,
  placeholder = 'City, barangay, or address',
  overlayResults = false,
  className,
}: {
  onPick: (place: PlaceSuggestion) => void
  label?: string
  placeholder?: string
  overlayResults?: boolean
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  async function runSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setSearching(true)
    setSearchError(null)
    try {
      const places = await forwardGeocode(q)
      setResults(places)
      if (!places.length) setSearchError('No places matched that search.')
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setSearching(false)
    }
  }

  function pick(place: PlaceSuggestion) {
    setResults([])
    setSearchError(null)
    setQuery('')
    onPick(place)
  }

  return (
    <div className={cn('relative w-full', className)}>
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      )}
      <form onSubmit={runSearch} className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="Search for a location"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {searching ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Search className="size-3.5" />
          )}
          Search
        </button>
      </form>

      {searchError && (
        <p className="mt-2 text-left text-xs text-red-500">{searchError}</p>
      )}

      {results.length > 0 && (
        <ul
          className={cn(
            'divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white text-left',
            overlayResults
              ? 'absolute left-0 right-0 top-full z-30 mt-2 shadow-lg'
              : 'mt-2',
          )}
        >
          {results.map((place) => (
            <li key={`${place.lat},${place.lng}`}>
              <button
                onClick={() => pick(place)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs text-slate-600 transition-colors hover:bg-blue-50"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-blue-500" />
                <span>{place.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Directions ─────────────────────────────────────────────────
type TravelMode = 'driving' | 'walking'

/** `driving-traffic` uses live traffic, which matters more than speed limits in a city. */
const DIRECTIONS_PROFILE: Record<TravelMode, string> = {
  driving: 'driving-traffic',
  walking: 'walking',
}

type RouteStep = { instruction: string; distance: number }

type Route = {
  vet: VetClinic
  mode: TravelMode
  duration: number // seconds
  distance: number // metres
  steps: RouteStep[]
  coordinates: [number, number][]
}

const ROUTE_SOURCE = 'vet-route'

async function fetchRoute(
  from: [number, number], // [lat, lng], as userCoords stores it
  to: [number, number], // [lng, lat], as Mapbox returns clinics
  mode: TravelMode,
  signal: AbortSignal,
): Promise<Omit<Route, 'vet' | 'mode'>> {
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/${DIRECTIONS_PROFILE[mode]}/${from[1]},${from[0]};${to[0]},${to[1]}`,
  )
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('overview', 'full')
  url.searchParams.set('steps', 'true')
  url.searchParams.set('language', 'en')
  url.searchParams.set('access_token', mapboxgl.accessToken as string)

  const res = await fetch(url.toString(), { signal })
  if (!res.ok) throw new Error(`Mapbox directions error: ${res.status}`)

  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('No route found to this clinic.')

  return {
    duration: route.duration,
    distance: route.distance,
    coordinates: route.geometry.coordinates,
    steps: (route.legs?.[0]?.steps ?? []).map(
      (step: { maneuver: { instruction: string }; distance: number }) => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
      }),
    ),
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

function formatDistance(metres: number): string {
  return metres < 1000
    ? `${Math.round(metres / 10) * 10} m`
    : `${(metres / 1000).toFixed(1)} km`
}

function googleMapsUrl(
  vet: VetClinic,
  origin: [number, number] | null,
  mode: TravelMode,
): string {
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  if (origin) url.searchParams.set('origin', `${origin[0]},${origin[1]}`)
  url.searchParams.set('destination', `${vet.name} ${vet.address}`)
  url.searchParams.set('travelmode', mode)
  return url.toString()
}

function RoutePanel({
  vet,
  route,
  mode,
  loading,
  error,
  origin,
  onModeChange,
  onClose,
}: {
  vet: VetClinic
  route: Route | null
  mode: TravelMode
  loading: boolean
  error: string | null
  origin: [number, number] | null
  onModeChange: (mode: TravelMode) => void
  onClose: () => void
}) {
  const [stepsOpen, setStepsOpen] = useState(false)

  return (
    // Phones: a card under the map, so the route stays visible.
    // Wider: floats over the map, stopping 4.5rem short of the bottom (24rem
    // map) so the re-center button stays clear.
    <div className="mt-3 flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:absolute sm:top-3 sm:left-3 sm:z-10 sm:mt-0 sm:max-h-[19.5rem] sm:w-[min(20rem,calc(100%-4.5rem))] sm:shadow-lg">
      <div className="flex items-start gap-2 px-3.5 pt-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold tracking-wider text-slate-400 uppercase">
            Directions to
          </p>
          <p className="truncate text-sm font-semibold text-slate-800">
            {vet.name}
          </p>
          <p className="truncate text-[11px] text-slate-500">{vet.address}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          aria-label="Clear the route"
          className="size-9 text-slate-400 hover:text-slate-700 sm:size-6 [&_svg]:size-4 sm:[&_svg]:size-3"
        >
          <X />
        </Button>
      </div>

      <div
        className="mt-3 flex gap-2 px-3.5 sm:mt-2.5 sm:gap-1"
        role="group"
        aria-label="Travel mode"
      >
        {(
          [
            ['driving', Car, 'Drive'],
            ['walking', Footprints, 'Walk'],
          ] as const
        ).map(([value, Icon, label]) => (
          <Button
            key={value}
            size="xs"
            variant={mode === value ? 'default' : 'outline'}
            aria-pressed={mode === value}
            onClick={() => onModeChange(value)}
            // Thumb-sized on phones, compact where the panel floats over the map.
            className={cn(
              'h-10 flex-1 text-sm sm:h-6 sm:text-xs [&_svg]:size-4 sm:[&_svg]:size-3',
              mode === value && 'bg-blue-600 text-white hover:bg-blue-700',
            )}
          >
            <Icon />
            {label}
          </Button>
        ))}
      </div>

      <div className="px-3.5 py-3">
        {loading ? (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="size-3.5 animate-spin text-blue-600" />
            Finding the best route…
          </p>
        ) : error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : route ? (
          <p className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {formatDuration(route.duration)}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {formatDistance(route.distance)}
            </span>
          </p>
        ) : null}
      </div>

      {route && !loading && route.steps.length > 0 && (
        <div className="flex min-h-0 flex-col border-t border-slate-100">
          <button
            type="button"
            onClick={() => setStepsOpen((open) => !open)}
            aria-expanded={stepsOpen}
            className="flex w-full items-center justify-between px-3.5 py-3 text-sm font-semibold text-slate-600 sm:py-2 sm:text-xs transition-colors hover:bg-slate-50"
          >
            {stepsOpen ? 'Hide steps' : `Show ${route.steps.length} steps`}
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform',
                stepsOpen && 'rotate-180',
              )}
            />
          </button>
          {stepsOpen && (
            <ol className="max-h-56 min-h-0 overflow-y-auto px-3.5 sm:max-h-none pb-2 [scrollbar-width:thin]">
              {route.steps.map((step, index) => (
                <li
                  key={index}
                  className="flex gap-2.5 border-t border-slate-50 py-1.5 text-xs first:border-t-0"
                >
                  <span className="w-4 shrink-0 text-right font-semibold text-slate-400 tabular-nums">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-slate-700">
                    {step.instruction}
                  </span>
                  {step.distance > 0 && (
                    <span className="shrink-0 text-slate-400 tabular-nums">
                      {formatDistance(step.distance)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <a
        href={googleMapsUrl(vet, origin, mode)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-500 sm:py-2 sm:text-[11px] transition-colors hover:text-blue-600"
      >
        Navigate in Google Maps
        <ExternalLink className="size-3" />
      </a>
    </div>
  )
}

// ── Geolocation failure empty state ────────────────────────────
type GeoFailure = { code: number; message: string }

function GeoErrorState({
  failure,
  onRetry,
  retrying,
  onPickPlace,
}: {
  failure: GeoFailure
  onRetry: () => void
  retrying: boolean
  onPickPlace: (place: PlaceSuggestion) => void
}) {
  const { title, hint, steps } =
    failure.code === 1
      ? {
          title: 'Location access denied',
          hint: 'To find clinics near you, allow location access in your browser.',
          steps: [
            <>Click the lock / info icon in the address bar</>,
            <>
              Set <span className="font-medium text-slate-600">Location</span>{' '}
              to <span className="font-medium text-slate-600">Allow</span>
            </>,
            <>Reload this page, then allow the prompt</>,
          ],
        }
      : failure.code === 3
        ? {
            title: 'Location request timed out',
            hint: 'Your browser did not return a position in time. This usually clears on a retry.',
            steps: [
              <>Make sure Wi-Fi is on — it improves accuracy indoors</>,
              <>
                Press{' '}
                <span className="font-medium text-slate-600">Try again</span>{' '}
                below
              </>,
            ],
          }
        : {
            title: "Couldn't determine your location",
            hint: 'Access is allowed, but your device could not produce a position fix.',
            steps: [
              <>
                Open{' '}
                <span className="font-medium text-slate-600">
                  System Settings → Privacy &amp; Security → Location Services
                </span>{' '}
                and enable it for your browser
              </>,
              <>Fully quit and reopen the browser after changing that toggle</>,
              <>
                Turn Wi-Fi on — location fixes rely on it when there is no GPS
              </>,
              <>
                Press{' '}
                <span className="font-medium text-slate-600">Try again</span>{' '}
                below
              </>,
            ],
          }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-400">
        <MapPin className="h-7 w-7" />
      </span>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
      </div>
      <ol className="text-left text-xs text-slate-400 space-y-1 list-decimal list-inside">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <button
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {retrying ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <LocateFixed className="size-3.5" />
        )}
        {retrying ? 'Locating…' : 'Try again'}
      </button>
      {failure.message && (
        <p className="text-[11px] text-slate-400">
          Browser reported: {failure.message} (code {failure.code})
        </p>
      )}

      <div className="mt-2 flex w-full flex-col items-center border-t border-slate-200 pt-6">
        <LocationSearch
          onPick={onPickPlace}
          label="Or search a location instead"
          className="max-w-md"
        />
      </div>
    </div>
  )
}

// ── User marker HTML ───────────────────────────────────────────
function createUserMarkerEl(label = 'You are here'): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText =
    'display:flex;flex-direction:column;align-items:center;gap:4px;'
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;border:3px solid white;background:var(--map-pin);box-shadow:0 0 0 4px color-mix(in oklab, var(--map-pin) 25%, transparent)">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
    </div>
    <span style="background:var(--map-pin);color:white;font-size:10px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:2px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15)">${label}</span>
  `
  return el
}

function getGeolocation(): Geolocation | undefined {
  return navigator.geolocation as Geolocation | undefined
}

export default function NearbyVetsGeoMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const userMarker = useRef<mapboxgl.Marker | null>(null)
  const vetMarkers = useRef<mapboxgl.Marker[]>([])
  const resizeObserver = useRef<ResizeObserver | null>(null)
  const [vets, setVets] = useState<VetClinic[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [geoFailure, setGeoFailure] = useState<GeoFailure | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [relocating, setRelocating] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [manualLocation, setManualLocation] = useState(false)
  const readyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapSection = useRef<HTMLDivElement>(null)
  const [routeVet, setRouteVet] = useState<VetClinic | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [travelMode, setTravelMode] = useState<TravelMode>('driving')
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const routeRequest = useRef<AbortController | null>(null)

  const { session } = useSupabaseSession()
  // Locked until a session proves otherwise, not the other way round — the
  // check is asynchronous, and briefly showing the full list before pulling it
  // back would give away exactly what the lock is holding.
  const isLocked = !session
  const visibleVets = useMemo(
    () => (isLocked ? vets.slice(0, PREVIEW_LIMIT) : vets),
    [isLocked, vets],
  )
  const hiddenCount = vets.length - visibleVets.length

  const locate = useCallback(() => {
    const geolocation = getGeolocation()
    if (!geolocation) {
      setGeoFailure({
        code: 2,
        message: 'Geolocation is not supported by this browser.',
      })
      setLoading(false)
      return
    }

    setLoading(true)

    geolocation.getCurrentPosition(
      ({ coords }: GeolocationPosition) => {
        const { latitude: lat, longitude: lng } = coords
        setGeoFailure(null)
        setManualLocation(false)
        setUserCoords([lat, lng])
        reverseGeocode(lat, lng)

        if (map.current) {
          userMarker.current?.setLngLat([lng, lat])
          map.current.flyTo({ center: [lng, lat], zoom: 13, duration: 1000 })
          searchNearbyVets(lat, lng)
        }
      },
      (err: GeolocationPositionError) => {
        setGeoFailure({ code: err.code, message: err.message })
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    )
  }, [])

  useEffect(() => {
    locate()

    return () => {
      if (readyTimeout.current) clearTimeout(readyTimeout.current)
      resizeObserver.current?.disconnect()
      resizeObserver.current = null
      map.current?.remove()
      map.current = null
    }
  }, [locate])

  const handlePickPlace = useCallback((place: PlaceSuggestion) => {
    setLoading(true)
    setError(null)
    setGeoFailure(null)
    setManualLocation(true)
    setUserAddress(place.name)
    setUserCoords([place.lat, place.lng])

    if (map.current) {
      userMarker.current?.setLngLat([place.lng, place.lat])
      map.current.flyTo({
        center: [place.lng, place.lat],
        zoom: 13,
        duration: 1000,
      })
      searchNearbyVets(place.lat, place.lng)
    }
  }, [])

  useEffect(() => {
    if (!userCoords || geoFailure || map.current) return
    initMap(userCoords[0], userCoords[1])
  }, [userCoords, geoFailure])

  async function reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const url = new URL('https://api.mapbox.com/search/geocode/v6/reverse')
      url.searchParams.set('longitude', String(lng))
      url.searchParams.set('latitude', String(lat))
      url.searchParams.set('language', 'en')
      url.searchParams.set('access_token', mapboxgl.accessToken as string)

      const res = await fetch(url.toString())
      if (!res.ok) return

      const data = await res.json()
      const place = data.features?.[0]?.properties?.full_address
      if (place) setUserAddress(place)
    } catch {
      // silently fail — address is not critical
    }
  }

  function initMap(lat: number, lng: number): void {
    if (!mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/jpdevdotcom/cmnv70588005601svfx2i0fff',
      center: [lng, lat],
      zoom: 13,
    })

    map.current.once('idle', () => {
      if (readyTimeout.current) clearTimeout(readyTimeout.current)
      setMapReady(true)
    })

    readyTimeout.current = setTimeout(() => setMapReady(true), 8000)

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver.current = new ResizeObserver(() => map.current?.resize())
      resizeObserver.current.observe(mapContainer.current)
    }

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    userMarker.current = new mapboxgl.Marker(
      createUserMarkerEl(manualLocation ? 'Searching here' : 'You are here'),
    )
      .setLngLat([lng, lat])
      .addTo(map.current)

    searchNearbyVets(lat, lng)
  }

  // ── Relocate: re-fetch GPS, move marker, refresh clinics ────
  const handleRelocate = useCallback(() => {
    const geolocation = getGeolocation()
    if (!geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }

    setRelocating(true)
    setError(null)

    geolocation.getCurrentPosition(
      ({ coords }: GeolocationPosition) => {
        const { latitude: lat, longitude: lng } = coords
        setManualLocation(false)
        setUserCoords([lat, lng])
        reverseGeocode(lat, lng)

        // Move the user marker
        if (userMarker.current) {
          userMarker.current.setLngLat([lng, lat])
        }

        // Re-center map
        if (map.current) {
          map.current.flyTo({ center: [lng, lat], zoom: 13, duration: 1000 })
        }

        // Remove old vet markers
        vetMarkers.current.forEach((m) => m.remove())
        vetMarkers.current = []

        // Clear state and search again
        setSelected(null)
        setVets([])
        searchNearbyVets(lat, lng).finally(() => setRelocating(false))
      },
      (err: GeolocationPositionError) => {
        setError(
          err.code === 1
            ? 'Location access is blocked for this site. Allow it from the address bar, then reload.'
            : `Could not refresh location: ${err.message || 'no position fix available'} (code ${err.code})`,
        )
        setRelocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [])

  async function searchNearbyVets(lat: number, lng: number): Promise<void> {
    clearRoute()
    setLoading(true)
    setError(null)
    try {
      const url = new URL(
        'https://api.mapbox.com/search/searchbox/v1/category/veterinarian',
      )
      url.searchParams.set('proximity', `${lng},${lat}`)
      url.searchParams.set('limit', '10')
      url.searchParams.set('language', 'en')
      url.searchParams.set('access_token', mapboxgl.accessToken as string)

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`Mapbox API error: ${res.status}`)

      const data: MapboxSearchResponse = await res.json()

      if (!data.features.length) {
        setError('No veterinary clinics found in this area. Try a nearby city.')
        setVets([])
        setSelected(null)
        vetMarkers.current.forEach((m) => m.remove())
        vetMarkers.current = []
        return
      }

      const results: VetClinic[] = data.features
        .map((f: MapboxSearchFeature) => ({
          id: f.properties.mapbox_id,
          name: f.properties.name,
          address: f.properties.full_address,
          phone: f.properties.metadata?.phone ?? null,
          distance: getDistanceKm(
            lat,
            lng,
            f.geometry.coordinates[1],
            f.geometry.coordinates[0],
          ),
          coords: f.geometry.coordinates,
          open: f.properties.metadata?.open_hours?.open_now ?? null,
        }))
        .sort((a: VetClinic, b: VetClinic) => a.distance - b.distance)

      setVets(results)
      // Markers are placed by the effect below, which also re-runs when the
      // list unlocks — a pin the card list is withholding would give the
      // clinic away just as well.
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to load nearby clinics.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!map.current) return
    addVetMarkers(visibleVets)
    // `addVetMarkers` only touches refs and setState, so what it is called
    // with — and whether the map exists to place pins on — is the whole story.
  }, [visibleVets, mapReady])

  function addVetMarkers(results: VetClinic[]): void {
    if (!map.current) return

    // Clear existing vet markers
    vetMarkers.current.forEach((m) => m.remove())
    vetMarkers.current = []

    results.forEach((vet, index) => {
      const el = document.createElement('div')
      el.className =
        'flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-(--map-accent) shadow-md text-white text-[11px] font-bold'
      if (index === 0) {
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="16" height="16" fill="#ffffff"><path d="M298.5 156.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5M164.4 262.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3s-14.3-70.1 10.2-84.1s59.7.9 78.5 33.3m-31.2 202.6C185.6 323.9 278.7 288 320 288s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2c-25.8 0-46.7-20.9-46.7-46.7v-1.6c0-10.4 1.6-20.8 5.2-30.5m352.6-118.5c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3m-111.7-93c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5"/></svg>`
      } else {
        el.textContent = String(index + 1)
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(vet.coords)
        .addTo(map.current!)

      vetMarkers.current.push(marker)

      // The pin's click outlives this render, so it goes through the ref to
      // pick up the current location and travel mode.
      el.addEventListener('click', () => {
        void showDirectionsRef.current(vet, { scrollToMap: false })
      })
    })
  }

  function drawRoute(coordinates: [number, number][]): void {
    const m = map.current
    if (!m) return
    const data: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates },
    }
    const source = m.getSource<mapboxgl.GeoJSONSource>(ROUTE_SOURCE)
    if (source) {
      source.setData(data)
    } else {
      // Mapbox paint can't read CSS variables, so resolve the theme's accent once.
      const accent =
        getComputedStyle(mapContainer.current ?? document.documentElement)
          .getPropertyValue('--map-accent')
          .trim() || '#2d5cf3'
      m.addSource(ROUTE_SOURCE, { type: 'geojson', data })
      m.addLayer({
        id: `${ROUTE_SOURCE}-casing`,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 9 },
      })
      m.addLayer({
        id: `${ROUTE_SOURCE}-line`,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': accent, 'line-width': 5 },
      })
    }

    const bounds = coordinates.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
    )
    // On wider screens the panel floats over the left of the map, so leave it room.
    const wide = (mapContainer.current?.clientWidth ?? 0) >= 640
    m.fitBounds(bounds, {
      padding: wide
        ? { top: 48, bottom: 48, right: 56, left: 360 }
        : { top: 32, bottom: 32, right: 48, left: 32 },
      duration: 900,
      maxZoom: 16,
    })
  }

  function clearRoute(): void {
    routeRequest.current?.abort()
    routeRequest.current = null
    setRouteVet(null)
    setRoute(null)
    setRouteError(null)
    setRouteLoading(false)
    const source = map.current?.getSource<mapboxgl.GeoJSONSource>(ROUTE_SOURCE)
    source?.setData({ type: 'FeatureCollection', features: [] })
  }

  async function showDirections(
    vet: VetClinic,
    {
      mode = travelMode,
      scrollToMap = true,
    }: { mode?: TravelMode; scrollToMap?: boolean } = {},
  ): Promise<void> {
    if (!userCoords) return
    if (scrollToMap) {
      mapSection.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
    // Clicking the clinic already on screen shouldn't spend another request.
    if (routeVet?.id === vet.id && route?.mode === mode && !routeError) return
    routeRequest.current?.abort()
    const controller = new AbortController()
    routeRequest.current = controller

    setSelected(vet.id)
    setRouteVet(vet)
    setTravelMode(mode)
    setRouteLoading(true)
    setRouteError(null)

    try {
      const result = await fetchRoute(
        userCoords,
        vet.coords,
        mode,
        controller.signal,
      )
      if (controller.signal.aborted) return
      setRoute({ ...result, vet, mode })
      drawRoute(result.coordinates)
    } catch (e: unknown) {
      if (controller.signal.aborted) return
      setRoute(null)
      setRouteError(
        e instanceof Error ? e.message : 'Could not load directions.',
      )
    } finally {
      if (!controller.signal.aborted) setRouteLoading(false)
    }
  }

  const showDirectionsRef = useRef(showDirections)
  showDirectionsRef.current = showDirections

  function getDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  return (
    <div className="flex flex-col gap-10">
      {!geoFailure && (
        <div className="space-y-3 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--map-pin) shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">
                {manualLocation ? 'Searching around' : 'Your current location'}
              </p>
              <p className="truncate text-sm text-slate-700">
                {userAddress ??
                  (userCoords
                    ? `${userCoords[0].toFixed(4)}, ${userCoords[1].toFixed(4)}`
                    : 'Locating…')}
              </p>
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
                  {manualLocation ? 'Use my location' : 'Refresh location'}
                </>
              )}
            </button>
          </div>

          <LocationSearch
            onPick={handlePickPlace}
            placeholder="Search another area — city, barangay, or address"
            overlayResults
          />
        </div>
      )}

      {!geoFailure && (
        <div ref={mapSection} className="relative">
          <div className="relative h-80 sm:h-96">
            <div
              className={cn(
                'h-full shrink-0 overflow-hidden rounded-2xl transition-opacity duration-500',
                mapReady ? 'opacity-100' : 'opacity-0',
              )}
            >
              <div ref={mapContainer} className="h-full w-full" />
            </div>

            {!mapReady && <MapSkeleton />}

            {/* My Location button overlaid on map (bottom-left) */}
            {mapReady && (
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

          {mapReady && routeVet && (
            <RoutePanel
              key={routeVet.id}
              vet={routeVet}
              route={route}
              mode={travelMode}
              loading={routeLoading}
              error={routeError}
              origin={userCoords}
              onModeChange={(mode) => void showDirections(routeVet, { mode })}
              onClose={clearRoute}
            />
          )}
        </div>
      )}

      <div className="space-y-4 bg-white">
        {/* Section header — the count rides the title row so the subtitle
            keeps the full width on phones */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-xl text-blue-500">
              {manualLocation ? 'Clinics In This Area' : 'Clinics Near You'}
            </h2>
            {!loading && !geoFailure && !error && vets.length > 0 && (
              <span
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap',
                  hiddenCount > 0
                    ? 'border-slate-200 bg-slate-50 text-slate-600'
                    : 'border-blue-100 bg-blue-50 text-blue-600',
                )}
              >
                {hiddenCount > 0
                  ? `${visibleVets.length} of ${vets.length} shown`
                  : `${vets.length} found`}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {manualLocation
              ? 'Sorted by distance from the location you searched.'
              : 'Sorted by distance from your current location.'}
          </p>
        </div>

        {geoFailure && (
          <GeoErrorState
            failure={geoFailure}
            onRetry={locate}
            retrying={loading}
            onPickPlace={handlePickPlace}
          />
        )}

        {/* Generic error */}
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Skeleton loading */}
        {loading && !geoFailure && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Clinic cards */}
        {!loading && vets.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visibleVets.map((vet, index) => (
              <Card
                key={vet.id}
                onClick={() => void showDirections(vet)}
                className={cn(
                  'cursor-pointer p-4 transition-all shadow-none border border-blue-100 rounded-xl hover:border-blue-300 hover:shadow-sm',
                  selected === vet.id &&
                    'ring-2 ring-blue-300 border-blue-300 bg-blue-50/40',
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        avatarColor(vet.name),
                      )}
                    >
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
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-emerald-600 sm:py-2 sm:text-xs hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                      >
                        <Phone className="size-3.5" />
                        Call
                      </a>
                    ) : (
                      <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-sm text-slate-300 sm:py-2 sm:text-xs cursor-not-allowed select-none">
                        <Phone className="size-3.5" />
                        No phone listed
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void showDirections(vet)
                      }}
                      disabled={!userCoords}
                      aria-pressed={routeVet?.id === vet.id}
                      className={cn(
                        'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors sm:py-2 sm:text-xs disabled:cursor-not-allowed disabled:opacity-50',
                        routeVet?.id === vet.id
                          ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                          : 'border-slate-200 text-blue-600 hover:border-blue-200 hover:bg-blue-50',
                      )}
                    >
                      <Navigation className="size-3.5" />
                      {routeVet?.id === vet.id ? 'Route shown' : 'Directions'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Built on the clinic card's own skeleton — avatar row, three
                lines, one action — so it sits flush in the grid instead of
                stretching the row and leaving the real cards half empty. */}
            {hiddenCount > 0 && (
              <Card className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-4 shadow-none">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                      <Lock className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight text-slate-800">
                        {hiddenCount} more{' '}
                        {hiddenCount === 1 ? 'clinic' : 'clinics'} nearby
                      </p>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        Phone numbers and directions included.
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        <MapPin className="size-2.5" />
                        {vets.length} found in this area
                      </span>
                    </div>
                  </div>

                  <AuthModal
                    notice={`Seeing every clinic nearby needs an account. Sign in to unlock the other ${hiddenCount} on this map.`}
                    trigger={
                      <button
                        type="button"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        <Lock className="size-3.5" />
                        Sign in to see all
                      </button>
                    }
                  />
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
