import { apiClient } from "../../shared/services/api.service";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface ApiExperience {
  id: number | string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  categoryId?: number | null;
  category?: {
    id: number;
    slug: string;
    label: string;
  } | null;
  tagIds?: number[];
  tags?: Array<{
    id: number | string;
  }> | null;
  country: string | null;
  adminRegion: string | null;
  city: string | null;
  street: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  images?:
    | Array<
        | string
        | {
            id?: number | string;
            url?: string | null;
          }
        | null
      >
    | null;
}

// -----------------------------------------------------------------------------
// CREATE (multipart/form-data)
// -----------------------------------------------------------------------------

export async function createExperience(formData: FormData) {
  return apiClient.post("/experiences", formData, {});
}

// -----------------------------------------------------------------------------
// READ
// -----------------------------------------------------------------------------

export async function getExperienceById(id: number | string) {
  return apiClient.get<ApiExperience>(`/experiences/${id}`);
}

export async function updateExperience(
  id: number | string,
  formData: FormData,
) {
  return apiClient.put(`/experiences/${id}`, formData, {});
}
