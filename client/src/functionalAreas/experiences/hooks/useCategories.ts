import { useState, useEffect } from "react";
import { apiClient } from "../../../shared/services/api.service";
import type { CategoryOption } from "../types/types";


export default function useCategories() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get<CategoryOption[]>("/categories");
        if (!cancelled) setCategories(res.data);
      } catch {
        if (!cancelled) setError("Unable to load categories.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true };
  }, []);

  return { categories, loading, error };
}
