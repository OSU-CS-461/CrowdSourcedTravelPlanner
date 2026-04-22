import { useEffect, useMemo, useState } from "react";
import type { CategoryOption, TagOption } from "../types/types";

interface TagSelectionProps {
  initialCategoryId?: number | null;
  initialTagIds?: number[];
  availableCategories?: CategoryOption[];
  availableFeatures?: TagOption[];
  tagsLoading?: boolean;
  featuresLoading?: boolean;
  tagsError?: string | null;
  onCategoryChange?: (categoryId: number | null) => void | Promise<void>;
  onTagIdsChange: (tagIds: number[]) => void;
}

export default function TagSelection({
  initialCategoryId = null,
  initialTagIds = [],
  availableCategories = [],
  availableFeatures = [],
  tagsLoading = false,
  featuresLoading = false,
  tagsError = null,
  onCategoryChange,
  onTagIdsChange,
}: TagSelectionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategoryId
  );
  const [featureSearch, setFeatureSearch] = useState("");
  const [featureToAddId, setFeatureToAddId] = useState<number | null>(null);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>(
    initialTagIds
  );

  useEffect(() => {
    onTagIdsChange([...selectedFeatureIds]);
  }, [onTagIdsChange, selectedFeatureIds]);

  useEffect(() => {
    void onCategoryChange?.(selectedCategoryId);
  }, [onCategoryChange, selectedCategoryId]);

  useEffect(() => {
    if (
      selectedCategoryId === null ||
      featuresLoading ||
      availableFeatures.length === 0
    ) {
      return;
    }
    const allowedFeatureIds = new Set(availableFeatures.map((feature) => feature.id));
    setSelectedFeatureIds((current) =>
      current.filter((featureId) => allowedFeatureIds.has(featureId))
    );
  }, [availableFeatures, featuresLoading, selectedCategoryId]);

  const selectableFeatures = useMemo(
    () =>
      availableFeatures.filter((feature) => {
        if (selectedFeatureIds.includes(feature.id)) return false;
        if (!featureSearch.trim()) return true;

        const normalizedSearch = featureSearch.toLowerCase();
        return (
          feature.label.toLowerCase().includes(normalizedSearch) ||
          feature.slug.toLowerCase().includes(normalizedSearch)
        );
      }),
    [availableFeatures, featureSearch, selectedFeatureIds]
  );

  function handleCategorySelect(value: string) {
    if (!value) {
      setSelectedCategoryId(null);
      setSelectedFeatureIds([]);
      setFeatureSearch("");
      setFeatureToAddId(null);
      return;
    }

    const nextCategoryId = Number(value);
    setSelectedCategoryId(nextCategoryId);
    setSelectedFeatureIds([]);
    setFeatureSearch("");
    setFeatureToAddId(null);
  }

  function handleAddFeature() {
    if (featureToAddId === null) return;
    if (selectedFeatureIds.includes(featureToAddId)) return;
    setSelectedFeatureIds([...selectedFeatureIds, featureToAddId]);
    setFeatureToAddId(null);
  }

  function handleRemoveFeature(featureId: number) {
    setSelectedFeatureIds(selectedFeatureIds.filter((id) => id !== featureId));
  }

  const selectedFeatures = selectedFeatureIds.map((id) => {
    const feature = availableFeatures.find((item) => item.id === id);
    if (feature) return feature;
    return { id, label: `Feature #${id}`, slug: "loading", categoryId: -1 };
  });

  const hasCategory = selectedCategoryId !== null;

  return (
    <section className="exp-form-section">
      <h3 className="exp-form-section-title">Tags</h3>

      {tagsLoading && <p className="exp-form-helper">Loading tags...</p>}
      {tagsError && <p className="exp-form-error">{tagsError}</p>}

      <label className="exp-form-field">
        <span>Category</span>
        <select
          value={selectedCategoryId === null ? "" : String(selectedCategoryId)}
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

      {!hasCategory ? (
        <p className="exp-form-helper">
          Choose a category to enable feature selection.
        </p>
      ) : (
        <div className="exp-form-subsection">
          {featuresLoading && <p className="exp-form-helper">Loading features...</p>}

          <label className="exp-form-field">
            <span>Search features</span>
            <input
              type="text"
              value={featureSearch}
              onChange={(e) => setFeatureSearch(e.target.value)}
              placeholder="Search feature by label or slug"
              disabled={featuresLoading || !!tagsError}
            />
          </label>

          <div className="exp-form-inline-group">
            <label className="exp-form-field">
              <span>Features</span>
              <select
                value={featureToAddId === null ? "" : String(featureToAddId)}
                onChange={(e) =>
                  setFeatureToAddId(e.target.value ? Number(e.target.value) : null)
                }
                disabled={
                  featuresLoading || !!tagsError || selectableFeatures.length === 0
                }
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
              disabled={featureToAddId === null || featuresLoading}
            >
              Add feature
            </button>
          </div>
        </div>
      )}

      {selectedFeatures.length > 0 && (
        <div className="exp-form-subsection">
          <p className="exp-form-helper">Selected features</p>
          <div className="exp-form-chip-list">
            {selectedFeatures.map((feature) => (
              <div key={feature.id} className="exp-form-chip">
                <span>
                  {feature.label} ({feature.slug})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(feature.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
