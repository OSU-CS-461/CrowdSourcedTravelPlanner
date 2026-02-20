import { type ComponentProps, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { apiClient } from "../../../shared/services/api.service";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type GeocodeResult = {
  displayName: string | null;
  lat: number;
  lon: number;
  country: string | null;
  adminRegion: string | null;
  city: string | null;
  street: string | null;
  postalCode: string | null;
};

export type LocationValue = {
  country: string;
  adminRegion?: string;
  city?: string;
  street?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  displayName?: string;
};

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function ClickToSet({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  type MapClickEvent = { latlng: { lat: number; lng: number } };

  useMapEvents({
    click(e: MapClickEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function SyncMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

function iso2OrFallback(raw: string | null): string {
  return (raw ?? "").trim().toUpperCase();
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: LocationValue | null;
  onChange: (loc: LocationValue | null) => void;
}) {
  const tileLayerProps = {
    attribution: "&copy; OpenStreetMap contributors",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  } as unknown as ComponentProps<typeof TileLayer>;

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 400);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (value) return [value.latitude, value.longitude];
    return [44.9429, -123.0351]; // default center (Salem) — change if you want
  }, [value]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const q = debouncedQuery.trim();
      if (q.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const resp = await apiClient.get<GeocodeResult[]>("/geocode/search", {
          params: { q },
        });
        if (!cancelled) setResults(resp.data ?? []);
      } catch {
        if (!cancelled) setErr("Search failed. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
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
        longitude: d.lon,
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

    onChange({
      country,
      adminRegion: r.adminRegion ?? undefined,
      city: r.city ?? undefined,
      street: r.street ?? undefined,
      postalCode: r.postalCode ?? undefined,
      latitude: r.lat,
      longitude: r.lon,
      displayName: r.displayName ?? undefined,
    });

    setResults([]);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <label>
          Search location
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a place or address…"
            style={{ width: "100%" }}
          />
        </label>
        {loading && <div style={{ fontSize: 12 }}>Searching…</div>}
        {err && <div style={{ color: "red", fontSize: 12 }}>{err}</div>}
      </div>

      {results.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, border: "1px solid #ddd" }}>
          {results.map((r) => (
            <li
              key={`${r.lat}-${r.lon}-${r.displayName ?? ""}`}
              onClick={() => pickResult(r)}
              style={{ padding: 8, cursor: "pointer", borderBottom: "1px solid #eee" }}
            >
              {r.displayName ?? `${r.lat}, ${r.lon}`}
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          border: "1px solid rgba(125, 125, 125, 0.35)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <MapContainer style={{ height: "100%", width: "100%" }}>
          <TileLayer {...tileLayerProps} />
          <SyncMapView center={center} zoom={12} />
          <ClickToSet onPick={reversePick} />
          {value && <Marker position={[value.latitude, value.longitude]} />}
        </MapContainer>
      </div>

      <div style={{ fontSize: 12, color: "inherit", opacity: 0.75 }}>
        <strong>Selected:</strong>{" "}
        {value?.displayName ??
          (value ? `${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}` : "None")}
      </div>

      <button
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
