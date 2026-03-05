import type { FormValues } from "../types/types.ts";
import type { ApiExperience } from "../experienceService";

export default function mapApiExperienceToFormValues(
  apiExperience: ApiExperience
): FormValues {
  return {
    title: apiExperience.title ?? "",
    description: apiExperience.description ?? "",
    image: apiExperience.thumbnail ?? "",
    categoryId: apiExperience.categoryId ?? apiExperience.category?.id ?? null,
    tagIds: apiExperience.tagIds ?? [],
    country: apiExperience.country ?? "",
    adminRegion: apiExperience.adminRegion ?? "",
    city: apiExperience.city ?? "",
    street: apiExperience.street ?? "",
    postalCode: apiExperience.postalCode ?? "",
    latitude:
      apiExperience.latitude !== null && apiExperience.latitude !== undefined
        ? String(apiExperience.latitude)
        : "",
    longitude:
      apiExperience.longitude !== null && apiExperience.longitude !== undefined
        ? String(apiExperience.longitude)
        : "",
  };
}
