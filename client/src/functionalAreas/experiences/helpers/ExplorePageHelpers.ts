import { type ViewportCoordinates } from "../types/types";

export function getCurrentCoords(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 }
    );
  });
}

// Rough bounding box around a point.
// Note: lng delta shrinks as you move away from the equator, so we adjust by cos(lat).
export function viewportFromCenter(
  lat: number,
  lng: number,
  radiusKm = 5
): ViewportCoordinates {
  const latDelta = radiusKm / 111.32; // ~ km per degree latitude
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180) || 1);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}