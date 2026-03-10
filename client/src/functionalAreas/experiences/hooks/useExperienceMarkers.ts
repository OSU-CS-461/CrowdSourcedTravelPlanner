import { useMemo } from "react";
import type { Experience, LocationMapMarker } from "../types/types";

export function useExperienceMarkers(experiences: Experience[]) {
  return useMemo<LocationMapMarker[]>(
    () =>
      experiences
        .filter(
          (e): e is Experience & { latitude: number; longitude: number } =>
            typeof e.latitude === "number" &&
            Number.isFinite(e.latitude) &&
            typeof e.longitude === "number" &&
            Number.isFinite(e.longitude)
        )
        .map((e) => ({ id: e.id, latitude: e.latitude, longitude: e.longitude })),
    [experiences]
  );
}