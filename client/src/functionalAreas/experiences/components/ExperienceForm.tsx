import { useState } from "react";

export interface TagOption {
  id: number;
  slug: string;
  label: string;
  type: "CATEGORY" | "FEATURE";
  parentCategoryId?: number | null;
}

export interface FormValues {
  title: string;
  description: string;
  image: string;
  keywords: string;
  tagIds: number[];
  country: string;
  adminRegion: string;
  city: string;
  street: string;
  postalCode: string;
  latitude: string;
  longitude: string;
}

interface FormTemplateProps {
  initialValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void | Promise<void>;
  submitLabel?: string;
  showTagSelector?: boolean;
  availableCategories?: TagOption[];
  availableFeatures?: TagOption[];
  tagsLoading?: boolean;
  featuresLoading?: boolean;
  tagsError?: string | null;
  onCategoryChange?: (categoryId: number | null) => void | Promise<void>;
}

export default function ExperienceForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
  showTagSelector = false,
  availableCategories = [],
  availableFeatures = [],
  tagsLoading = false,
  featuresLoading = false,
  tagsError = null,
  onCategoryChange,
}: FormTemplateProps) {
  const [title, setTitle] = useState(initialValues.title ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [error, setError] = useState("");

  const [image, setImage] = useState(initialValues.image ?? "");
  const [keywords, setKeywords] = useState(initialValues.keywords ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [featureSearch, setFeatureSearch] = useState("");
  const [featureToAddId, setFeatureToAddId] = useState<number | "">("");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);

  const [country, setCountry] = useState(initialValues.country ?? "");
  const [adminRegion, setAdminRegion] = useState(initialValues.adminRegion ?? "");
  const [city, setCity] = useState(initialValues.city ?? "");
  const [street, setStreet] = useState(initialValues.street ?? "");
  const [postalCode, setPostalCode] = useState(initialValues.postalCode ?? "");
  const [latitude, setLatitude] = useState(initialValues.latitude ?? "");
  const [longitude, setLongitude] = useState(initialValues.longitude ?? "");

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    const tagIds: number[] = [];
    if (selectedCategoryId !== "") {
      tagIds.push(selectedCategoryId);
    }
    tagIds.push(...selectedFeatureIds);

    const payload: FormValues = {
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      keywords: keywords.trim(),
      tagIds,
      country: country.trim(),
      adminRegion: adminRegion.trim(),
      city: city.trim(),
      street: street.trim(),
      postalCode: postalCode.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
    };

    try {
      await onSubmit(payload);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving. Please try again.");
    }
  }

  const selectableFeatures = availableFeatures.filter((feature) => {
    if (selectedFeatureIds.includes(feature.id)) return false;
    if (!featureSearch.trim()) return true;

    const normalizedSearch = featureSearch.toLowerCase();
    return (
      feature.label.toLowerCase().includes(normalizedSearch) ||
      feature.slug.toLowerCase().includes(normalizedSearch)
    );
  });

  const selectedFeatures = selectedFeatureIds
    .map((id) => availableFeatures.find((feature) => feature.id === id))
    .filter((feature): feature is TagOption => Boolean(feature));

  function handleCategorySelect(value: string) {
    if (!value) {
      setSelectedCategoryId("");
      setSelectedFeatureIds([]);
      setFeatureSearch("");
      setFeatureToAddId("");
      void onCategoryChange?.(null);
      return;
    }

    const nextCategoryId = Number(value);
    setSelectedCategoryId(nextCategoryId);
    setSelectedFeatureIds([]);
    setFeatureSearch("");
    setFeatureToAddId("");
    void onCategoryChange?.(nextCategoryId);
  }

  function handleAddFeature() {
    if (featureToAddId === "") return;
    if (selectedFeatureIds.includes(featureToAddId)) return;
    setSelectedFeatureIds([...selectedFeatureIds, featureToAddId]);
    setFeatureToAddId("");
  }

  function handleRemoveFeature(featureId: number) {
    setSelectedFeatureIds(selectedFeatureIds.filter((id) => id !== featureId));
  }

// Form Layout
  return (
    <form onSubmit={handleSubmit}>
      <h2>Experience Details</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <label>
        Title
        <br />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <br />
      <br />

      <label>
        Description
        <textarea
          rows={5} cols={80}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>

      <br />

      <h3>Location</h3>

      <label>
        Country
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        State / Region
        <input
          type="text"
          value={adminRegion}
          onChange={(e) => setAdminRegion(e.target.value)}
        />
      </label>

      <br />

      <label>
        City
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </label>

      <br />

      <label>
        Street
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />
      </label>

      <br />

      <label>
        Postal Code
        <input
          type="text"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
        />
      </label>

      <br />

      <label>
        Latitude
        <input
          type="text"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="e.g. 37.7749"
        />
      </label>

      <br />

      <label>
        Longitude
        <input
          type="text"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="-122.4194"
        />
      </label>

      <br />

      <label>
        Image URL
        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </label>

      {image && (
        <div style={{ marginTop: "10px" }}>
          <p>Image preview:</p>
          <img
            src={image}
            alt="Preview"
            style={{ maxWidth: "300px", maxHeight: "200px" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <br />

      <label>
        Keywords (comma separated)
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="adventure, beach, food"
        />
      </label>

      <br />
      <br />

      {showTagSelector && (
        <>
          <h3>Tags</h3>

          {tagsLoading && <p>Loading tags...</p>}
          {tagsError && <p style={{ color: "red" }}>{tagsError}</p>}

          <label>
            Category
            <select
              value={selectedCategoryId === "" ? "" : String(selectedCategoryId)}
              onChange={(e) => handleCategorySelect(e.target.value)}
              disabled={tagsLoading || !!tagsError || availableCategories.length === 0}
            >
              <option value="">Select a category</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label} ({category.slug})
                </option>
              ))}
            </select>
          </label>

          <br />

          {selectedCategoryId === "" ? (
            <p style={{ color: "#555" }}>Choose a category to enable feature selection.</p>
          ) : (
            <div style={{ marginTop: "8px" }}>
              {featuresLoading && <p>Loading features...</p>}

              <label>
                Search features
                <input
                  type="text"
                  value={featureSearch}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                  placeholder="Search feature by label or slug"
                  disabled={featuresLoading || !!tagsError}
                />
              </label>

              <br />

              <label>
                Features
                <select
                  value={featureToAddId === "" ? "" : String(featureToAddId)}
                  onChange={(e) =>
                    setFeatureToAddId(e.target.value ? Number(e.target.value) : "")
                  }
                  disabled={featuresLoading || !!tagsError || selectableFeatures.length === 0}
                >
                  <option value="">Select a feature</option>
                  {selectableFeatures.map((feature) => (
                    <option key={feature.id} value={feature.id}>
                      {feature.label} ({feature.slug})
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={handleAddFeature}
                disabled={featureToAddId === "" || featuresLoading}
                style={{ marginLeft: "8px" }}
              >
                Add feature
              </button>
            </div>
          )}

          {selectedFeatures.length > 0 && (
            <div style={{ marginTop: "10px", color: "#1f2937" }}>
              <p style={{ color: "#1f2937" }}>Selected features:</p>
              {selectedFeatures.map((feature) => (
                <div key={feature.id} style={{ marginBottom: "6px" }}>
                  <span style={{ color: "#1f2937" }}>
                    {feature.label} ({feature.slug})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(feature.id)}
                    style={{ marginLeft: "8px" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <br />

      <button type="submit">{submitLabel}</button>
    </form>
  );
}
