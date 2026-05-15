import { useEffect, useMemo, useState } from "react";
import { createCategoryTag } from "../../../shared/services/api.service";
import SearchSelect, {
  type SearchSelectOption,
} from "../../../shared/components/SearchSelect";
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
  likedTags?: TagOption[];
}

const NON_ALPHANUMERIC = /[^a-z0-9]+/g;
const WHITESPACE = /\s+/g;

function normalizeTagText(input: string): string {
  return input
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, " ")
    .trim()
    .replace(WHITESPACE, " ");
}

function searchScore(tag: TagOption, query: string): number {
  if (!query) return 0;

  const labelNormalized = normalizeTagText(tag.label);
  const slugNormalized = normalizeTagText(tag.slug);
  const haystack = `${labelNormalized} ${slugNormalized}`.trim();
  const queryTokens = query.split(" ").filter(Boolean);
  const hayTokens = haystack.split(" ").filter(Boolean);

  if (labelNormalized === query || slugNormalized === query) return 220;
  if (labelNormalized.startsWith(query) || slugNormalized.startsWith(query)) return 180;
  if (labelNormalized.includes(query) || slugNormalized.includes(query)) return 140;

  if (queryTokens.length && queryTokens.every((token) => hayTokens.includes(token))) {
    return 120;
  }

  if (
    queryTokens.length &&
    queryTokens.every((token) =>
      hayTokens.some((hayToken) => hayToken.startsWith(token))
    )
  ) {
    return 100;
  }

  if (haystack.includes(query)) return 90;
  return -1;
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
  likedTags = [],
}: TagSelectionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategoryId
  );
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialTagIds);
  const [categoryTags, setCategoryTags] = useState<TagOption[]>(availableFeatures);
  const [createTagError, setCreateTagError] = useState<string | null>(null);
  const [creatingTag, setCreatingTag] = useState(false);

  useEffect(() => {
    setCategoryTags(availableFeatures);
  }, [availableFeatures]);

  useEffect(() => {
    onTagIdsChange([...selectedTagIds]);
  }, [onTagIdsChange, selectedTagIds]);

  useEffect(() => {
    void onCategoryChange?.(selectedCategoryId);
  }, [onCategoryChange, selectedCategoryId]);

  useEffect(() => {
    if (selectedCategoryId === null || featuresLoading || categoryTags.length === 0) {
      return;
    }
    const allowedTagIds = new Set(categoryTags.map((tag) => tag.id));
    setSelectedTagIds((current) => current.filter((tagId) => allowedTagIds.has(tagId)));
  }, [categoryTags, featuresLoading, selectedCategoryId]);

  function handleCategorySelect(value: string) {
    setCreateTagError(null);
    if (!value) {
      setSelectedCategoryId(null);
      setSelectedTagIds([]);
      setTagSearch("");
      return;
    }

    const nextCategoryId = Number(value);
    setSelectedCategoryId(nextCategoryId);
    setSelectedTagIds([]);
    setTagSearch("");
    setCategoryTags([]);
  }

  function handleRemoveTag(tagId: number) {
    setSelectedTagIds((current) => current.filter((id) => id !== tagId));
  }

  function selectTagId(tagId: number) {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current : [...current, tagId]
    );
    setTagSearch("");
    setCreateTagError(null);
  }

  const selectedTags = selectedTagIds.map((id) => {
    const tag = categoryTags.find((item) => item.id === id);
    if (tag) return tag;
    return { id, label: `Tag #${id}`, slug: "loading", categoryId: -1 };
  });

  const hasCategory = selectedCategoryId !== null;
  const likedTagIds = useMemo(() => {
    if (selectedCategoryId === null) return new Set<number>();
    return new Set(
      likedTags
        .filter((tag) => tag.categoryId === selectedCategoryId)
        .map((tag) => tag.id)
    );
  }, [likedTags, selectedCategoryId]);

  const normalizedQuery = normalizeTagText(tagSearch);
  const rankedOptions = useMemo(() => {
    const unselectedTags = categoryTags.filter(
      (tag) => !selectedTagIds.includes(tag.id)
    );

    const scored = unselectedTags
      .map((tag) => ({
        tag,
        liked: likedTagIds.has(tag.id),
        score: searchScore(tag, normalizedQuery),
      }))
      .filter((row) => (normalizedQuery ? row.score >= 0 : true));

    scored.sort((a, b) => {
      if (normalizedQuery && a.score !== b.score) return b.score - a.score;
      if (a.liked !== b.liked) return a.liked ? -1 : 1;
      return a.tag.label.localeCompare(b.tag.label);
    });

    return scored;
  }, [categoryTags, likedTagIds, normalizedQuery, selectedTagIds]);

  const exactNormalizedDuplicateExists = useMemo(() => {
    if (!normalizedQuery) return false;
    return categoryTags.some(
      (tag) =>
        normalizeTagText(tag.label) === normalizedQuery ||
        normalizeTagText(tag.slug) === normalizedQuery
    );
  }, [categoryTags, normalizedQuery]);

  const searchOptions: SearchSelectOption[] = rankedOptions.map((row) => ({
    id: String(row.tag.id),
    label: row.tag.label,
    supportingText: row.tag.slug,
    badgeText: row.liked ? "Saved" : undefined,
  }));

  const shouldShowAddRow =
    hasCategory &&
    normalizedQuery.length > 0 &&
    !exactNormalizedDuplicateExists &&
    !featuresLoading &&
    !creatingTag;

  const addRow = shouldShowAddRow
    ? { label: `Add new tag: "${tagSearch.trim()}"` }
    : null;

  async function handleCreateTag() {
    if (selectedCategoryId === null) return;
    const name = tagSearch.trim();
    if (!name) return;

    setCreateTagError(null);
    setCreatingTag(true);
    try {
      const tag = await createCategoryTag(selectedCategoryId, name);
      setCategoryTags((current) => {
        const exists = current.some((item) => item.id === tag.id);
        if (exists) return current;
        return [...current, tag].sort((a, b) => a.label.localeCompare(b.label));
      });
      selectTagId(tag.id);
    } catch (err) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: unknown } } }).response?.data
          ?.error === "string"
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setCreateTagError(message ?? "Could not create tag.");
    } finally {
      setCreatingTag(false);
    }
  }

  return (
    <section className="exp-form-section">
      <h3 className="exp-form-section-title">Tags</h3>

      {tagsLoading && <p className="exp-form-helper">Loading tags...</p>}
      {(tagsError || createTagError) && (
        <p className="exp-form-error">{tagsError ?? createTagError}</p>
      )}

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
              {category.label}
            </option>
          ))}
        </select>
      </label>

      {!hasCategory ? (
        <p className="exp-form-helper">Choose a category to search and select tags.</p>
      ) : (
        <div className="exp-form-subsection">
          <SearchSelect
            label="Search tags"
            placeholder="Search tags by name or slug"
            value={tagSearch}
            disabled={featuresLoading || !!tagsError}
            loading={featuresLoading}
            options={searchOptions}
            addRow={addRow}
            noResultsText="No tags match your search."
            keepOpenOnSelect
            onValueChange={setTagSearch}
            onSelectOption={(optionId) => selectTagId(Number(optionId))}
            onSelectAddRow={() => {
              void handleCreateTag();
            }}
          />
        </div>
      )}

      {selectedTags.length > 0 && (
        <div className="exp-form-subsection">
          <p className="exp-form-helper">Selected tags</p>
          <div className="exp-form-chip-list">
            {selectedTags.map((tag) => (
              <div key={tag.id} className="exp-form-chip">
                <span>
                  {tag.label}
                </span>
                <button
                  type="button"
                  className="exp-form-chip-action"
                  aria-label={`Remove ${tag.label}`}
                  onClick={() => handleRemoveTag(tag.id)}
                >
                  −
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
