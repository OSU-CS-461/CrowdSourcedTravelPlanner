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

  const existingMedia = (
    apiExperience.media ??
    (apiExperience.images ?? []).map((image) => {
      if (typeof image === "string") {
        return {
          id: image,
          url: image,
          type: "image" as const,
          mimeType: null,
          fileSizeBytes: null,
          originalFilename: null,
        };
      }
      if (image && typeof image === "object" && typeof image.url === "string") {
        return {
          id: image.id ?? image.url,
          url: image.url,
          type:
            image.mediaType === "VIDEO"
              ? ("video" as const)
              : ("image" as const),
          mimeType: image.mimeType ?? null,
          fileSizeBytes: image.fileSizeBytes ?? null,
          originalFilename: image.originalFilename ?? null,
        };
      }
      return null;
    })
  )
    .map((item) => {
      if (!item || typeof item.url !== "string" || item.url.trim().length === 0) {
        return null;
      }
      return {
        id: item.id ?? item.url,
        url: item.url.trim(),
        type: item.type === "video" ? "video" : "image",
        mimeType: item.mimeType ?? null,
        fileSizeBytes: item.fileSizeBytes ?? null,
        originalFilename: item.originalFilename ?? null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    title: apiExperience.title ?? "",
    description: apiExperience.description ?? "",
    image: apiExperience.thumbnail ?? "",
    categoryId: apiExperience.categoryId ?? apiExperience.category?.id ?? null,
    tagIds,
    existingImages,
    existingMedia,
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
