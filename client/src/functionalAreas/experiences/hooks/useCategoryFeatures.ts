import { useEffect, useState } from "react";
import { apiClient } from "../../../shared/services/api.service";
import type { TagOption } from "../types/types";

export default function useCategoryFeatures(categoryId: number | null) {
  const [features, setFeatures] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setFeatures([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get<TagOption[]>(
          `/categories/${categoryId}/tags`
        );
        if (!cancelled) setFeatures(res.data);
      } catch {
        if (!cancelled) setError("Unable to load features.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true };
  }, [categoryId]);

  return { features, loading, error };
}
