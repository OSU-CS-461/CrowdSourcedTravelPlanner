import { useEffect, useState } from "react";
import { apiClient } from "../../../shared/services/api.service";
import type { Experience, ViewportCoordinates } from "../types/types";

type ExperienceFilters = {
  categoryId: number | null;
  tags: string[];
  tagMode: "or" | "and";
};

export function useExperiencesInViewport(
  currentMapArea: ViewportCoordinates | null,
  filters: ExperienceFilters
) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tagsKey = filters.tags.join(",");

  useEffect(() => {
    if (!currentMapArea) {
      setExperiences([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        ...currentMapArea,
        limit: 50,
      };

      if (filters.categoryId !== null) {
        params.categoryId = filters.categoryId;
      }
      if (tagsKey.length > 0) {
        params.tags = tagsKey;
        params.tagMode = filters.tagMode;
      }

      apiClient
        .get<Experience[]>("/experiences", {
          params,
        })
        .then((res) => {
          if (!cancelled) setExperiences(res.data);
        })
        .catch((err) => {
          console.error(err);
          if (!cancelled) {
            setExperiences([]);
            setError("Failed to fetch experiences for this location.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    currentMapArea,
    filters.categoryId,
    filters.tagMode,
    tagsKey,
  ]);

  return { experiences, loading, error };
}
