import { Router, Request, Response } from "express";

const router = Router();

const NOMINATIM_BASE =
  process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org";
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ??
  "CrowdSourcedTravelPlanner/1.0 (nominatim proxy)";
const NOMINATIM_REFERER =
  process.env.NOMINATIM_REFERER ?? "http://localhost:5173";
const SEARCH_CACHE_TTL_MS = 60_000;
const SEARCH_LIMIT_DEFAULT = 8;
const SEARCH_LIMIT_MAX = 10;
const KM_PER_LAT_DEGREE = 111.32;

type NominatimAddress = Partial<{
  house_number: string;
  road: string;
  neighbourhood: string;
  suburb: string;
  city: string;
  town: string;
  village: string;
  hamlet: string;
  county: string;
  state: string;
  region: string;
  postcode: string;
  country: string;
  country_code: string;
}>;

type NominatimPlaceResult = {
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  namedetails?: { name?: string };
  category?: string;
  type?: string;
  address?: NominatimAddress;
  boundingbox?: string[];
};

type ViewportCoordinates = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

type GeocodeAddress = {
  house_number: string | null;
  road: string | null;
  neighbourhood: string | null;
  suburb: string | null;
  city: string | null;
  town: string | null;
  village: string | null;
  hamlet: string | null;
  county: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  country_code: string | null;
};

type GeocodeResult = {
  placeId: number | null;
  osmType: string | null;
  osmId: number | null;
  lat: number;
  lng: number;
  lon: number; // legacy compatibility
  displayName: string | null;
  name: string;
  address: GeocodeAddress;
  category: string;
  boundingBox: ViewportCoordinates | null;
  // Legacy fields (kept for existing UI usage)
  country: string | null;
  adminRegion: string | null;
  city: string | null;
  street: string | null;
  postalCode: string | null;
};

const searchCache = new Map<string, { expiresAt: number; results: GeocodeResult[] }>();

function toIso2(code: string | null | undefined): string | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return normalized.length === 2 ? normalized : null;
}

function parseFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseViewportBoundsFromQuery(req: Request): ViewportCoordinates | null {
  const minLat = parseFiniteNumber(req.query.minLat);
  const maxLat = parseFiniteNumber(req.query.maxLat);
  const minLng = parseFiniteNumber(req.query.minLng);
  const maxLng = parseFiniteNumber(req.query.maxLng);

  if (
    minLat === null ||
    maxLat === null ||
    minLng === null ||
    maxLng === null
  ) {
    return null;
  }
  if (minLat > maxLat || minLng > maxLng) return null;

  return { minLat, maxLat, minLng, maxLng };
}

function viewportFromCenter(
  lat: number,
  lng: number,
  radiusKm = 25
): ViewportCoordinates {
  const safeRadius = Math.min(Math.max(radiusKm, 1), 300);
  const latDelta = safeRadius / KM_PER_LAT_DEGREE;
  const lngDelta =
    safeRadius / (KM_PER_LAT_DEGREE * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

  return {
    minLat: Math.max(-90, lat - latDelta),
    maxLat: Math.min(90, lat + latDelta),
    minLng: Math.max(-180, lng - lngDelta),
    maxLng: Math.min(180, lng + lngDelta),
  };
}

function parseViewportFromCenterQuery(req: Request): ViewportCoordinates | null {
  const lat = parseFiniteNumber(req.query.lat);
  const lng = parseFiniteNumber(req.query.lng);
  if (lat === null || lng === null) return null;

  const radiusKmRaw = parseFiniteNumber(req.query.radiusKm);
  const radiusKm = radiusKmRaw === null ? 25 : radiusKmRaw;
  return viewportFromCenter(lat, lng, radiusKm);
}

function viewportToViewbox(bounds: ViewportCoordinates): string {
  return `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
}

function parseCountrycodes(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  const uniqueCodes = Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .map((item) => toIso2(item))
        .filter((item): item is string => item !== null)
        .map((item) => item.toLowerCase())
    )
  );
  return uniqueCodes.length ? uniqueCodes.join(",") : null;
}

function toCategoryLabel(category: string | undefined, type: string | undefined): string {
  if (category && type) return `${category}:${type}`.replaceAll("_", " ");
  return (category ?? type ?? "").replaceAll("_", " ");
}

function firstSegment(displayName: string | null | undefined): string {
  if (!displayName) return "";
  const [first] = displayName.split(",");
  return first?.trim() ?? "";
}

function parseBoundingBox(
  rawBoundingBox: string[] | undefined
): ViewportCoordinates | null {
  if (!rawBoundingBox || rawBoundingBox.length < 4) return null;

  const south = parseFiniteNumber(rawBoundingBox[0]);
  const north = parseFiniteNumber(rawBoundingBox[1]);
  const west = parseFiniteNumber(rawBoundingBox[2]);
  const east = parseFiniteNumber(rawBoundingBox[3]);

  if (south === null || north === null || west === null || east === null) {
    return null;
  }

  return {
    minLat: Math.min(south, north),
    maxLat: Math.max(south, north),
    minLng: Math.min(west, east),
    maxLng: Math.max(west, east),
  };
}

function normalizeAddress(address: NominatimAddress | undefined): GeocodeAddress {
  return {
    house_number: address?.house_number ?? null,
    road: address?.road ?? null,
    neighbourhood: address?.neighbourhood ?? null,
    suburb: address?.suburb ?? null,
    city: address?.city ?? null,
    town: address?.town ?? null,
    village: address?.village ?? null,
    hamlet: address?.hamlet ?? null,
    county: address?.county ?? null,
    state: address?.state ?? address?.region ?? null,
    postcode: address?.postcode ?? null,
    country: address?.country ?? null,
    country_code: toIso2(address?.country_code),
  };
}

function pickAddressParts(address: GeocodeAddress) {
  const country = toIso2(address.country_code);
  const adminRegion = address.state ?? address.county ?? null;
  const city =
    address.city ?? address.town ?? address.village ?? address.hamlet ?? null;
  const street =
    [address.house_number, address.road].filter((part) => Boolean(part)).join(" ") ||
    null;
  const postalCode = address.postcode ?? null;

  return { country, adminRegion, city, street, postalCode };
}

function normalizePlaceResult(raw: NominatimPlaceResult): GeocodeResult | null {
  const lat = parseFiniteNumber(raw.lat);
  const lon = parseFiniteNumber(raw.lon);
  if (lat === null || lon === null) return null;

  const address = normalizeAddress(raw.address);
  const legacyAddress = pickAddressParts(address);

  return {
    placeId:
      typeof raw.place_id === "number" && Number.isFinite(raw.place_id)
        ? raw.place_id
        : null,
    osmType: raw.osm_type ?? null,
    osmId:
      typeof raw.osm_id === "number" && Number.isFinite(raw.osm_id)
        ? raw.osm_id
        : null,
    lat,
    lng: lon,
    lon,
    displayName: raw.display_name ?? null,
    name: raw.namedetails?.name?.trim() || firstSegment(raw.display_name) || "",
    address,
    category: toCategoryLabel(raw.category, raw.type),
    boundingBox: parseBoundingBox(raw.boundingbox),
    ...legacyAddress,
  };
}

function buildNominatimHeaders(req: Request): Record<string, string> {
  const referer = req.get("origin") ?? req.get("referer") ?? NOMINATIM_REFERER;
  return {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
    Referer: referer,
  };
}

function getCachedSearchResult(cacheKey: string): GeocodeResult[] | null {
  const cached = searchCache.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    searchCache.delete(cacheKey);
    return null;
  }
  return cached.results;
}

function setCachedSearchResult(cacheKey: string, results: GeocodeResult[]) {
  searchCache.set(cacheKey, {
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    results,
  });

  // Keep cache bounded.
  if (searchCache.size <= 250) return;
  for (const [key, value] of searchCache.entries()) {
    if (value.expiresAt <= Date.now()) {
      searchCache.delete(key);
    }
    if (searchCache.size <= 250) break;
  }
}

// GET /api/geocode/search?q=...
router.get("/search", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 3) return res.json([] satisfies GeocodeResult[]);

    const limitRaw = parseFiniteNumber(req.query.limit);
    const limit =
      limitRaw === null
        ? SEARCH_LIMIT_DEFAULT
        : Math.min(Math.max(Math.floor(limitRaw), 1), SEARCH_LIMIT_MAX);
    const acceptLanguage =
      String(req.query.acceptLanguage ?? req.query.locale ?? "en").trim() || "en";

    const url = new URL(`${NOMINATIM_BASE}/search`);
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("namedetails", "1");
    url.searchParams.set("extratags", "1");
    url.searchParams.set("accept-language", acceptLanguage);

    const bounds =
      parseViewportBoundsFromQuery(req) ?? parseViewportFromCenterQuery(req);
    if (bounds) {
      url.searchParams.set("viewbox", viewportToViewbox(bounds));
      url.searchParams.set("bounded", "1");
    }

    const countrycodes = parseCountrycodes(
      req.query.countrycodes ?? req.query.country
    );
    if (countrycodes) {
      url.searchParams.set("countrycodes", countrycodes);
    }

    const cacheKey = url.toString();
    const cachedResults = getCachedSearchResult(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }

    const response = await fetch(url, { headers: buildNominatimHeaders(req) });
    if (!response.ok) {
      return res.status(502).json({ error: "Nominatim search failed" });
    }

    const data = (await response.json()) as NominatimPlaceResult[];
    const results = data
      .map(normalizePlaceResult)
      .filter((result): result is GeocodeResult => result !== null);

    setCachedSearchResult(cacheKey, results);
    return res.json(results);
  } catch {
    return res.status(502).json({ error: "Nominatim search failed" });
  }
});

// GET /api/geocode/reverse?lat=...&lon=...
router.get("/reverse", async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "Invalid lat/lon" });
    }

    const acceptLanguage =
      String(req.query.acceptLanguage ?? req.query.locale ?? "en").trim() || "en";

    const url = new URL(`${NOMINATIM_BASE}/reverse`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("namedetails", "1");
    url.searchParams.set("extratags", "1");
    url.searchParams.set("accept-language", acceptLanguage);

    const response = await fetch(url, { headers: buildNominatimHeaders(req) });
    if (!response.ok) {
      return res.status(502).json({ error: "Nominatim reverse failed" });
    }

    const raw = (await response.json()) as NominatimPlaceResult;
    const normalized =
      normalizePlaceResult(raw) ??
      normalizePlaceResult({
        ...raw,
        lat: String(lat),
        lon: String(lon),
      });

    if (!normalized) {
      return res.status(502).json({ error: "Nominatim reverse failed" });
    }

    return res.json(normalized);
  } catch {
    return res.status(502).json({ error: "Nominatim reverse failed" });
  }
});

export default router;
