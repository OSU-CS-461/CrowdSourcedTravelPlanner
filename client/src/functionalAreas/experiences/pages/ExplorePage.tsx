import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ClientRoutes } from "../../../shared/clientRoutes";
import { apiClient } from "../../../shared/services/api.service";
import LocationPicker from "../components/LocationPicker";
import ExperienceList from "../components/ExperienceList";
import type { ViewportCoordinates, LocationValue, TagOption } from "../types/types";
import "./ExplorePage.css";

import { useExperiencesInViewport } from "../hooks/useExperiencesInViewport";
import { useExperienceMarkers } from "../hooks/useExperienceMarkers";
import { getCurrentCoords, viewportFromCenter } from "../helpers/ExplorePageHelpers";
import useCategories from "../hooks/useCategories";

export default function ExplorePage() {
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const [searchLocation, setSearchLocation] = useState<LocationValue | null>(null);
  const [currentMapArea, setcurrentMapArea] = useState<ViewportCoordinates | null>(null);
  const [highlightedExperienceId, setHighlightedExperienceId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<"or" | "and">("or");
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [isTagPopupOpen, setIsTagPopupOpen] = useState(false);
  const [draftTagSlugs, setDraftTagSlugs] = useState<string[]>([]);
  const [tagPopupCategoryId, setTagPopupCategoryId] = useState<number | null>(null);

  const { experiences, loading, error } = useExperiencesInViewport(currentMapArea, {
    categoryId: selectedCategoryId,
    tags: selectedTagSlugs,
    tagMode,
  });
  const experienceMarkers = useExperienceMarkers(experiences);
  const selectablePopupTags = useMemo(() => {
    if (tagPopupCategoryId === null) return allTags;
    return allTags.filter((tag) => tag.categoryId === tagPopupCategoryId);
  }, [allTags, tagPopupCategoryId]);
  const selectedTagChips = useMemo(
    () =>
      selectedTagSlugs.map((slug) => ({
        slug,
        label: allTags.find((tag) => tag.slug === slug)?.label ?? slug,
      })),
    [allTags, selectedTagSlugs]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { lat, lng } = await getCurrentCoords();
        if (cancelled) return;

        setSearchLocation({ latitude: lat, longitude: lng } as LocationValue);
        setcurrentMapArea(viewportFromCenter(lat, lng, 8));
      } catch (err) {
        console.warn("Could not get user location:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTags() {
      try {
        setTagsLoading(true);
        setTagsError(null);
        const response = await apiClient.get<TagOption[]>("/tags");
        if (!cancelled) {
          setAllTags(response.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setTagsError("Unable to load tags.");
        }
      } finally {
        if (!cancelled) {
          setTagsLoading(false);
        }
      }
    }

    void loadTags();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function clearMarkerSelection() {
      setHighlightedExperienceId(null);
    }

    document.addEventListener("mousedown", clearMarkerSelection);
    return () => document.removeEventListener("mousedown", clearMarkerSelection);
  }, []);

  useEffect(() => {
    if (highlightedExperienceId === null) return;
    const hasHighlightedExperience = experiences.some(
      (experience) => experience.id === highlightedExperienceId
    );
    if (!hasHighlightedExperience) {
      setHighlightedExperienceId(null);
    }
  }, [experiences, highlightedExperienceId]);

  function toggleDraftTag(slug: string) {
    setDraftTagSlugs((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  }

  function openTagPopup() {
    setDraftTagSlugs(selectedTagSlugs);
    setIsTagPopupOpen(true);
  }

  function closeTagPopup() {
    setIsTagPopupOpen(false);
  }

  function applyTagFilters() {
    setSelectedTagSlugs(draftTagSlugs);
    setIsTagPopupOpen(false);
  }

  function removeSelectedTag(slug: string) {
    setSelectedTagSlugs((prev) => prev.filter((item) => item !== slug));
  }

  function clearFilters() {
    setSelectedCategoryId(null);
    setSelectedTagSlugs([]);
    setTagMode("or");
    setDraftTagSlugs([]);
  }

  return (
    <main className="explore-main">
      <h1>Explore Page</h1>

      <div className="explore-layout">
        <section className="explore-results">
          <div className="explore-filters">
            <div className="explore-filter-row">
              <label className="explore-filter-control">
                Category
                <select
                  value={selectedCategoryId ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedCategoryId(value ? Number(value) : null);
                  }}
                  disabled={categoriesLoading}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="explore-filter-row">
              <button type="button" className="explore-tag-button" onClick={openTagPopup}>
                Filter Tags
              </button>

              <div className="explore-filter-mode" role="group" aria-label="Tag match mode">
                <label>
                  <input
                    type="radio"
                    name="explore-tag-mode"
                    value="or"
                    checked={tagMode === "or"}
                    onChange={() => setTagMode("or")}
                  />
                  OR
                </label>
                <label>
                  <input
                    type="radio"
                    name="explore-tag-mode"
                    value="and"
                    checked={tagMode === "and"}
                    onChange={() => setTagMode("and")}
                  />
                  AND
                </label>
              </div>

              {selectedTagChips.map((tag) => (
                <span key={tag.slug} className="explore-selected-tag">
                  {tag.label}
                  <button
                    type="button"
                    aria-label={`Remove ${tag.label} tag`}
                    onClick={() => removeSelectedTag(tag.slug)}
                  >
                    ×
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={clearFilters}
                disabled={
                  selectedCategoryId === null &&
                  selectedTagSlugs.length === 0 &&
                  tagMode === "or"
                }
              >
                Clear Filters
              </button>
            </div>

            {(categoriesError || tagsError) && (
              <p className="explore-filter-error">{categoriesError ?? tagsError}</p>
            )}

            {isTagPopupOpen && (
              <div className="explore-tag-popup" role="dialog" aria-modal="true">
                <div className="explore-tag-popup-header">
                  <h3>Filter Experiences</h3>
                  <button
                    type="button"
                    className="explore-tag-popup-close"
                    aria-label="Close tag filters"
                    onClick={closeTagPopup}
                  >
                    ×
                  </button>
                </div>

                <div className="explore-tag-popup-body">
                  <label className="explore-filter-control">
                    Filter tags by category (optional)
                    <select
                      value={tagPopupCategoryId ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setTagPopupCategoryId(value ? Number(value) : null);
                      }}
                    >
                      <option value="">All Tag Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <h4>Available Tags</h4>
                  <div className="explore-tag-grid">
                    {tagsLoading ? (
                      <p className="explore-filter-helper">Loading tags...</p>
                    ) : selectablePopupTags.length === 0 ? (
                      <p className="explore-filter-helper">No tags available.</p>
                    ) : (
                      selectablePopupTags.map((tag) => (
                        <label key={tag.slug} className="explore-tag-option">
                          <input
                            type="checkbox"
                            checked={draftTagSlugs.includes(tag.slug)}
                            onChange={() => toggleDraftTag(tag.slug)}
                          />
                          {tag.label}
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="explore-tag-popup-footer">
                  <button type="button" onClick={closeTagPopup}>
                    Cancel
                  </button>
                  <button type="button" className="explore-apply-button" onClick={applyTagFilters}>
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {!currentMapArea ? (
            <p>Move or zoom the map to set a search window.</p>
          ) : loading ? (
            <p>Loading experiences...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <ExperienceList
              experiences={experiences}
              selectedId={highlightedExperienceId}
              onExperienceClick={(id) =>
                navigate(ClientRoutes.EXPERIENCE_DETAILS.replace(":id", String(id)))
              }
              emptyMessage="No experiences found in the current map window."
            />
          )}
        </section>

        <aside className="explore-map">
          <LocationPicker
            value={searchLocation}
            onChange={setSearchLocation}
            markers={experienceMarkers}
            onViewportChange={setcurrentMapArea}
            onMarkerSelect={(markerId) => setHighlightedExperienceId(Number(markerId))}
            selectedMarkerId={highlightedExperienceId}
            allowMapSelection={false}
            showSelectedMarker={false}
          />
        </aside>
      </div>
    </main>
  );
}
