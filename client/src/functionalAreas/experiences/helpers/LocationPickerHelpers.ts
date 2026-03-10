import { useEffect, useRef, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";

import { type ViewportCoordinates } from "../types/types";

function emitViewportFromMap(
  map: unknown,
  onViewportChange?: (viewport: ViewportCoordinates) => void
) {
  if (!onViewportChange) return;
  const bounds = (
    map as {
      getBounds: () => {
        getSouth: () => number;
        getNorth: () => number;
        getWest: () => number;
        getEast: () => number;
      };
    }
  ).getBounds();

  onViewportChange({
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast(),
  });
}

export function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function ClickToSet({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  type MapClickEvent = { latlng: { lat: number; lng: number } };

  useMapEvents({
    click(e: MapClickEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function SyncMapView({
  center,
  zoom,
  onViewportChange,
}: {
  center: [number, number];
  zoom: number;
  onViewportChange?: (viewport: ViewportCoordinates) => void;
}) {
  const map = useMap();
  const didInitializeView = useRef(false);

  useEffect(() => {
    let frame = 0;

    if (!didInitializeView.current) {
      map.setView(center, zoom);
      didInitializeView.current = true;
      frame = window.requestAnimationFrame(() => emitViewportFromMap(map, onViewportChange));
      return () => window.cancelAnimationFrame(frame);
    }

    map.setView(center, map.getZoom(), { animate: false });
    frame = window.requestAnimationFrame(() => emitViewportFromMap(map, onViewportChange));
    return () => window.cancelAnimationFrame(frame);
  }, [map, center, zoom, onViewportChange]);

  return null;
}

export function EmitViewport({
  onViewportChange,
}: {
  onViewportChange?: (viewport: ViewportCoordinates) => void;
}) {
  const map = useMapEvents({
    moveend() {
      if (!onViewportChange) return;
      const bounds = (
        map as unknown as {
          getBounds: () => {
            getSouth: () => number;
            getNorth: () => number;
            getWest: () => number;
            getEast: () => number;
          };
        }
      ).getBounds();

      onViewportChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    },
    zoomend() {
      if (!onViewportChange) return;
      const bounds = (
        map as unknown as {
          getBounds: () => {
            getSouth: () => number;
            getNorth: () => number;
            getWest: () => number;
            getEast: () => number;
          };
        }
      ).getBounds();

      onViewportChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    },
  });

  useEffect(() => {
    if (!onViewportChange) return;
    const bounds = (
      map as unknown as {
        getBounds: () => {
          getSouth: () => number;
          getNorth: () => number;
          getWest: () => number;
          getEast: () => number;
        };
      }
    ).getBounds();

    onViewportChange({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    });
  }, [map, onViewportChange]);

  return null;
}

export function iso2OrFallback(raw: string | null): string {
  return (raw ?? "").trim().toUpperCase();
}
