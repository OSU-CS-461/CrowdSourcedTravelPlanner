import { type ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { apiClient } from "../../../shared/services/api.service";
import { type ViewportCoordinates, type LocationValue, type LocationMapMarker, type GeocodeResult} from "../types/types";
import { useDebounced, iso2OrFallback, SyncMapView, EmitViewport, ClickToSet } from "../helpers/LocationPickerHelpers";


// Fix Leaflet's default marker icon paths when using a bundler (e.g., Vite).
// Leaflet tries to auto-resolve image URLs internally, which breaks in modern
// build setups. We remove its internal URL resolver and manually provide
// the correct bundled image paths so default markers render properly.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const selectedExperienceMarkerIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
  className: "selected-experience-marker",
});
const defaultExperienceMarkerIcon = new L.Icon.Default();

const SEARCH_CACHE_TTL_MS = 60_000;
const EARTH_RADIUS_KM = 6371;

type Coordinates = { lat: number; lng: number };

function getLongitude(result: GeocodeResult): number {
  if (typeof result.lng === "number" && Number.isFinite(result.lng)) {
    return result.lng;
  }
  return result.lon;
}

function getResultPrimaryLine(result: GeocodeResult): string {
  if (typeof result.name === "string" && result.name.trim().length > 0) {
    return result.name.trim();
  }

  const firstSegment = result.displayName?.split(",")[0]?.trim();
  if (firstSegment) return firstSegment;

  return `${result.lat.toFixed(5)}, ${getLongitude(result).toFixed(5)}`;
}

function getResultSecondaryLine(result: GeocodeResult): string {
  const address = result.address;
  const cityOrTown =
    address?.city ??
    address?.town ??
    address?.village ??
    address?.hamlet ??
    result.city ??
    null;
  const adminRegion = address?.state ?? result.adminRegion ?? null;
  const country = address?.country ?? null;

  const concise = [cityOrTown, adminRegion, country]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(", ");
  if (concise.length > 0) return concise;

  return result.displayName ?? `${result.lat.toFixed(5)}, ${getLongitude(result).toFixed(5)}`;
}

function normalizeMatchText(value: string): string {
  return value.trim().toLowerCase();
}

function getMatchStrengthTier(result: GeocodeResult, query: string): number {
  const normalizedQuery = normalizeMatchText(query);
  const primary = normalizeMatchText(getResultPrimaryLine(result));
  const display = normalizeMatchText(result.displayName ?? "");

  if (!normalizedQuery) return 3;
  if (primary === normalizedQuery) return 0;
  if (primary.startsWith(normalizedQuery)) return 1;
  if (display.includes(normalizedQuery)) return 2;
  return 3;
}

function haversineDistanceKm(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(endLat - startLat);
  const dLng = toRadians(endLng - startLng);
  const aLat = toRadians(startLat);
  const bLat = toRadians(endLat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat) * Math.cos(bLat) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

function sortSearchResults(
  input: GeocodeResult[],
  query: string,
  anchor: Coordinates | null
): GeocodeResult[] {
  return [...input]
    .map((result, index) => {
      const tier = getMatchStrengthTier(result, query);
      const distanceKm = anchor
        ? haversineDistanceKm(anchor.lat, anchor.lng, result.lat, getLongitude(result))
        : Number.POSITIVE_INFINITY;

      return { result, index, tier, distanceKm };
    })
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return a.index - b.index;
    })
    .map((entry) => entry.result);
}

function buildMarkerVisualProps(
  markerId: number | string,
  selectedMarkerId: number | string | null | undefined
): Record<string, unknown> {
  return {
    icon:
      selectedMarkerId !== undefined &&
      selectedMarkerId !== null &&
      String(selectedMarkerId) === String(markerId)
        ? selectedExperienceMarkerIcon
        : defaultExperienceMarkerIcon,
  };
}




export default function LocationPicker({
  value,
  onChange,
  markers = [],
  onViewportChange,
  onMarkerSelect,
  selectedMarkerId,
  allowMapSelection = true,
  showSelectedMarker = true,
}: {
  value: LocationValue | null;
  onChange: (loc: LocationValue | null) => void;
  markers?: LocationMapMarker[];
  onViewportChange?: (viewport: ViewportCoordinates) => void;
  onMarkerSelect?: (markerId: number | string) => void;
  selectedMarkerId?: number | string | null;
  allowMapSelection?: boolean;
  showSelectedMarker?: boolean;
}) {

  
  const tileLayerProps = {
    attribution: "&copy; OpenStreetMap contributors",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  } as unknown as ComponentProps<typeof TileLayer>;
  const mapContainerProps = { minZoom: 3 } as Record<string, number>;

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 400);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [currentUserCoords, setCurrentUserCoords] = useState<Coordinates | null>(null);
  const selectedMarkerRef = useRef<{
    dragging?: { enable: () => void; disable: () => void };
  } | null>(null);
  const suppressNextSearchRef = useRef(false);
  const sortAnchorRef = useRef<Coordinates | null>(null);
  const searchCacheRef = useRef<
    Map<string, { expiresAt: number; results: GeocodeResult[] }>
  >(new Map());

  const center = useMemo<[number, number]>(() => {
    if (value) return [value.latitude, value.longitude];
    return [44.9429, -123.0351]; // default center (Salem) — change if you want
  }, [value]);

  useEffect(() => {
    const marker = selectedMarkerRef.current;
    if (!marker?.dragging) return;
    if (allowMapSelection) marker.dragging.enable();
    else marker.dragging.disable();
  }, [allowMapSelection, value]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setCurrentUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // No-op: location tie-break is optional.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    sortAnchorRef.current =
      currentUserCoords ??
      (value &&
      Number.isFinite(value.latitude) &&
      Number.isFinite(value.longitude)
        ? { lat: value.latitude, lng: value.longitude }
        : null);
  }, [currentUserCoords, value]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      const q = debouncedQuery.trim();
      if (q.length < 3) {
        setResults([]);
        setErr(null);
        return;
      }

      if (suppressNextSearchRef.current) {
        suppressNextSearchRef.current = false;
        return;
      }

      const sortAnchor = sortAnchorRef.current;

      const params: Record<string, string | number> = {
        q,
        limit: 5,
        acceptLanguage: typeof navigator !== "undefined" ? navigator.language : "en",
      };

      const cacheKey = JSON.stringify(params);
      const cached = searchCacheRef.current.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        setResults(sortSearchResults(cached.results, q, sortAnchor));
        setErr(null);
        return;
      }

      setLoading(true);
      setErr(null);
      try {
        const resp = await apiClient.get<GeocodeResult[]>("/geocode/search", {
          params,
          signal: controller.signal,
        });
        if (!cancelled) {
          const rawResults = resp.data ?? [];
          const nextResults = sortSearchResults(rawResults, q, sortAnchor);
          setResults(nextResults);
          searchCacheRef.current.set(cacheKey, {
            expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
            results: rawResults,
          });
        }
      } catch (error) {
        if ((error as { code?: string }).code === "ERR_CANCELED") {
          return;
        }
        if (!cancelled) setErr("Search failed. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedQuery]);

  async function reversePick(lat: number, lon: number) {
    setErr(null);
    try {
      const resp = await apiClient.get<GeocodeResult>("/geocode/reverse", {
        params: { lat, lon },
      });
      const d = resp.data;

      const country = iso2OrFallback(d.country);
      if (country.length !== 2) {
        setErr("Could not determine country code. Please enter country manually.");
        return;
      }

      onChange({
        country,
        adminRegion: d.adminRegion ?? undefined,
        city: d.city ?? undefined,
        street: d.street ?? undefined,
        postalCode: d.postalCode ?? undefined,
        latitude: d.lat,
        longitude: getLongitude(d),
        displayName: d.displayName ?? undefined,
      });

      setResults([]);
    } catch {
      setErr("Reverse geocode failed. Try another spot.");
    }
  }

  function pickResult(r: GeocodeResult) {
    const country = iso2OrFallback(r.country);
    if (country.length !== 2) {
      setErr("Result missing country code. Pick another result or enter manually.");
      return;
    }
    suppressNextSearchRef.current = true;

    onChange({
      country,
      adminRegion: r.adminRegion ?? undefined,
      city: r.city ?? undefined,
      street: r.street ?? undefined,
      postalCode: r.postalCode ?? undefined,
      latitude: r.lat,
      longitude: getLongitude(r),
      displayName: r.displayName ?? undefined,
    });

    setResults([]);
  }

  return (
    <div className="location-picker" style={{ display: "grid", gap: 10 }}>
      <div className="location-picker__search">
        <label className="location-picker__search-label">
          Search location
          <input
            className="location-picker__search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a place or address…"
            style={{ width: "100%" }}
          />
        </label>
        {loading && <div className="location-picker__search-status" style={{ fontSize: 12 }}>Searching…</div>}
        {err && <div className="location-picker__search-error" style={{ color: "red", fontSize: 12 }}>{err}</div>}
      </div>

      {results.length > 0 && (
        <ul className="location-picker__results" style={{ listStyle: "none", padding: 0, margin: 0, border: "1px solid #ddd" }}>
          {results.map((r) => (
            <li
              className="location-picker__result-item"
              key={`${r.placeId ?? `${r.lat}-${getLongitude(r)}`}-${r.displayName ?? ""}`}
              onClick={() => pickResult(r)}
              style={{
                padding: 8,
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                display: "grid",
                gap: 2,
              }}
            >
              <span className="location-picker__result-primary" style={{ fontWeight: 600 }}>{getResultPrimaryLine(r)}</span>
              <span className="location-picker__result-secondary" style={{ fontSize: 12, color: "#5f6368" }}>
                {getResultSecondaryLine(r)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div
        className="location-picker__map-wrap"
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          border: "1px solid rgba(125, 125, 125, 0.35)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <MapContainer style={{ height: "100%", width: "100%" }} {...mapContainerProps}>
          <TileLayer {...tileLayerProps} />
          <SyncMapView center={center} zoom={12} onViewportChange={onViewportChange} />
          {allowMapSelection && <ClickToSet onPick={reversePick} />}
          <EmitViewport onViewportChange={onViewportChange} />
          {markers.map((marker) => (
            <Marker
              key={`marker-${marker.id}`}
              position={[marker.latitude, marker.longitude]}
              {...buildMarkerVisualProps(marker.id, selectedMarkerId)}
              eventHandlers={{
                click: () => {
                  onMarkerSelect?.(marker.id);
                },
              }}
            />
          ))}
          {showSelectedMarker && value && (
            <Marker
              ref={(marker) => {
                selectedMarkerRef.current = marker as
                  | { dragging?: { enable: () => void; disable: () => void } }
                  | null;
              }}
              position={[value.latitude, value.longitude]}
              eventHandlers={{
                dragend: (event: {
                  target: { getLatLng: () => { lat: number; lng: number } };
                }) => {
                  if (!allowMapSelection) return;
                  const position = event.target.getLatLng();
                  void reversePick(position.lat, position.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="location-picker__selected" style={{ fontSize: 12, color: "inherit", opacity: 0.75 }}>
        <strong>Selected:</strong>{" "}
        {value?.displayName ??
          (value ? `${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}` : "None")}
      </div>

      <button
        className="location-picker__clear-btn"
        type="button"
        onClick={() => {
          setErr(null);
          setResults([]);
          onChange(null);
        }}
      >
        Clear location
      </button>
    </div>
  );
}
