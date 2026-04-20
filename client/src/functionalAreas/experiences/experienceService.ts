import { apiClient } from "../../shared/services/api.service";

export type ReviewSortOption = 'recent' | 'highest' | 'lowest' | 'media';

export interface CreateExperienceDto {
  title: string;
  description: string;
  categoryId: number;
  country: string;
  latitude: number;
  longitude: number;
  adminRegion?: string;
  city?: string;
  street?: string;
  postalCode?: string;
  thumbnail?: string;
  tagIds: number[];
}

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
  country: string | null;
  adminRegion: string | null;
  city: string | null;
  street: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  reviews?: any[]; 
}

// experience.service.ts
export async function createExperience(payload: CreateExperienceDto) {
  return apiClient.post("/experiences", payload);
}

export async function getExperienceById(id: number | string, sort?: ReviewSortOption) {
  const url = sort ? `/experiences/${id}?sort=${sort}` : `/experiences/${id}`;
  return apiClient.get<ApiExperience>(url);
}

export async function updateExperience(
  id: number | string,
  payload: CreateExperienceDto
) {
  return apiClient.put(`/experiences/${id}`, payload);
}
