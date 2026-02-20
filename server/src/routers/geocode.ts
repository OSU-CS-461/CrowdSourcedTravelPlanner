import { Router, Request, Response } from "express";

const router = Router();

const NOMINATIM_BASE =
  process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org";
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ??
  "CrowdSourcedTravelPlanner/1.0 (nominatim proxy)";

type NominatimAddress = Partial<{
  country_code: string;
  state: string;
  region: string;
  county: string;
  city: string;
  town: string;
  village: string;
  hamlet: string;
  road: string;
  house_number: string;
  postcode: string;
}>;

function toIso2(code: string | null | undefined): string | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return normalized.length === 2 ? normalized : null;
}

function pickAddressParts(addr: NominatimAddress | undefined) {
  const country = toIso2(addr?.country_code);
  const adminRegion = addr?.state ?? addr?.region ?? addr?.county ?? null;
  const city = addr?.city ?? addr?.town ?? addr?.village ?? addr?.hamlet ?? null;
  const street = [addr?.house_number, addr?.road].filter(Boolean).join(" ") || null;
  const postalCode = addr?.postcode ?? null;

  return { country, adminRegion, city, street, postalCode };
}

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

// GET /api/geocode/search?q=...
router.get("/search", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 3) return res.json([] satisfies GeocodeResult[]);

    const url = new URL(`${NOMINATIM_BASE}/search`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", q);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");

    const r = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!r.ok) return res.status(502).json({ error: "Nominatim search failed" });

    const data = (await r.json()) as Array<{
      display_name?: string;
      lat: string;
      lon: string;
      address?: NominatimAddress;
    }>;

    const results: GeocodeResult[] = data
      .map((x) => {
        const lat = Number(x.lat);
        const lon = Number(x.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

        return {
          displayName: x.display_name ?? null,
          lat,
          lon,
          ...pickAddressParts(x.address),
        };
      })
      .filter((x): x is GeocodeResult => x !== null);

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

    const url = new URL(`${NOMINATIM_BASE}/reverse`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("addressdetails", "1");

    const r = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!r.ok) return res.status(502).json({ error: "Nominatim reverse failed" });

    const x = (await r.json()) as {
      display_name?: string;
      address?: NominatimAddress;
    };

    const result: GeocodeResult = {
      displayName: x.display_name ?? null,
      lat,
      lon,
      ...pickAddressParts(x.address),
    };

    return res.json(result);
  } catch {
    return res.status(502).json({ error: "Nominatim reverse failed" });
  }
});

export default router;
