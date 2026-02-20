import type { FormValues } from "../components/ExperienceForm";

export default function buildExpCreationPayload(values: FormValues) {
  if (!values.categoryId || values.categoryId <= 0) {
    throw new Error("A valid category is required.");
  }

  const country = values.country.trim().toUpperCase();
  if (country.length !== 2) {
    throw new Error("Country must be ISO-2");
  }

  const latitude = Number(values.latitude.trim());
  const longitude = Number(values.longitude.trim());

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Latitude/Longitude invalid");
  }

  const adminRegion = values.adminRegion?.trim() || undefined;
  const city = values.city?.trim() || undefined;
  const street = values.street?.trim() || undefined;
  const postalCode = values.postalCode?.trim() || undefined;

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    categoryId: values.categoryId,
    country,
    latitude,
    longitude,
    adminRegion,
    city,
    street,
    postalCode,
    thumbnail: values.image?.trim() || undefined,
    tagIds: values.tagIds,
  };
}
