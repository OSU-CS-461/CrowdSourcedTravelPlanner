import type { FormValues } from "../types/types.ts";
import type { ApiExperience } from "../experienceService";

export default function mapApiExperienceToFormValues(
  apiExperience: ApiExperience
): FormValues {
  const tagIds =
    apiExperience.tagIds ??
    apiExperience.tags
      ?.map((tag) => Number(tag.id))
      .filter((id) => Number.isInteger(id) && id > 0) ??
    [];

  const existingImages = (apiExperience.images ?? [])
    .map((image) => {
      if (typeof image === "string") return image.trim();
      if (
        image &&
        typeof image === "object" &&
        typeof image.url === "string"
      ) {
        return image.url.trim();
      }
      return "";
    })
    .filter((url) => url.length > 0);

  return {
    title: apiExperience.title ?? "",
    description: apiExperience.description ?? "",
    image: apiExperience.thumbnail ?? "",
    categoryId: apiExperience.categoryId ?? apiExperience.category?.id ?? null,
    tagIds,
    existingImages,
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
