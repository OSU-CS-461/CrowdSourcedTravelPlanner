export interface ExperienceCardProps {
  experience: Experience;
}

// ---- Experience Form ----

export interface TagOption {
  id: number;
  slug: string;
  label: string;
  categoryId: number;
}

export interface CategoryOption {
  id: number;
  slug: string;
  label: string;
}

export interface FormValues {
  title: string;
  description: string;
  image: string;
  existingImages?: string[];
  categoryId: number | null;
  tagIds: number[];
  country: string;
  adminRegion: string;
  city: string;
  street: string;
  postalCode: string;
  latitude: string;
  longitude: string;
}

export interface FormTemplateProps {
  initialValues?: Partial<FormValues>;
  onSubmit: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  showTagSelector?: boolean;
  availableCategories?: CategoryOption[];
  availableFeatures?: TagOption[];
  tagsLoading?: boolean;
  featuresLoading?: boolean;
  tagsError?: string | null;
  onCategoryChange?: (categoryId: number | null) => void | Promise<void>;
  /** Tags the user saved (e.g. from My Interests); quick-add when category matches. */
  likedTags?: TagOption[];
}

// ---- Location Picker ----

export type GeocodeResult = {
  placeId?: number | null;
  osmType?: string | null;
  osmId?: number | null;
  displayName: string | null;
  name?: string;
  lat: number;
  lng?: number;
  lon: number;
  address?: {
    house_number: string | null;
    road: string | null;
    neighbourhood: string | null;
    suburb: string | null;
    city: string | null;
    town: string | null;
    village: string | null;
    hamlet?: string | null;
    county: string | null;
    state: string | null;
    postcode: string | null;
    country: string | null;
    country_code: string | null;
  };
  category?: string;
  boundingBox?: ViewportCoordinates | null;
  country: string | null;
  adminRegion: string | null;
  city: string | null;
  street: string | null;
  postalCode: string | null;
};

export type LocationValue = {
  country: string;
  adminRegion?: string;
  city?: string;
  street?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  displayName?: string;
};

export type LocationMapMarker = {
  id: number | string;
  latitude: number;
  longitude: number;
};

export type ViewportCoordinates = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

// ---- Explore Page ----

export type ExperienceTag = {
  id: number;
  label: string;
  slug: string;
  categoryId?: number | null;
};

export type ExperienceCategory = {
  id: number;
  label: string;
  slug: string;
};

export type Experience = {
  id: number;
  title: string;
  description: string;
  dateCreated: string;
  createdByUsername?: string | null;
  thumbnail?: string;
  country?: string;
  city?: string;
  adminRegion?: string;
  street?: string | null;
  postalCode?: string | null;
  category?: ExperienceCategory | null;
  tags?: ExperienceTag[];
  tagIds?: number[];
  categoryTags?: ExperienceTag[];
  featureTags?: ExperienceTag[];
  avgRating?: number | null;
  reviewCount?: number;
  mostRecentReviewAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number;
};
