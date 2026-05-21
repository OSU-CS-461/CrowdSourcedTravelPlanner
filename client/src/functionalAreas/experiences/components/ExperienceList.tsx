import type { Experience } from "../types/types";

type ExperienceWithDistance = Experience & {
  distanceKm?: number;
};

type Props = {
  experiences: Experience[];
  selectedId?: number | null;
  variant?: "row" | "card";

  // Simple click callback
  onExperienceClick?: (id: number) => void;

  // Simple "edit buttons" option (only renders if true)
  editButtons?: boolean;
  onEditClick?: (id: number) => void;
  onDeleteClick?: (id: number) => void;
  deletingId?: number | null;

  emptyMessage?: string;
};

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23eef2f7'/><stop offset='100%' stop-color='%23d8dee8'/></linearGradient></defs><rect width='1200' height='800' fill='url(%23g)'/><rect x='450' y='285' width='300' height='190' rx='20' fill='%23c7d0dc'/><circle cx='530' cy='350' r='26' fill='%23b2bcc9'/><path d='M470 445l90-84 74 60 50-40 66 64z' fill='%23a7b2c0'/><text x='600' y='540' text-anchor='middle' font-family='Arial,sans-serif' font-size='44' fill='%23738091'>No Image</text></svg>";

function resolveImage(exp: Experience): string {
  const firstPhoto = Array.isArray((exp as Experience & { photos?: unknown }).photos)
    ? (exp as Experience & { photos?: Array<{ url?: string | null } | string> }).photos?.find(
        (photo) => {
          if (typeof photo === "string") return photo.trim().length > 0;
          return typeof photo?.url === "string" && photo.url.trim().length > 0;
        },
      )
    : null;

  if (typeof exp.thumbnail === "string" && exp.thumbnail.trim()) return exp.thumbnail;
  if (typeof (exp as Experience & { imageUrl?: string }).imageUrl === "string") {
    const imageUrl = (exp as Experience & { imageUrl?: string }).imageUrl?.trim();
    if (imageUrl) return imageUrl;
  }
  if (typeof firstPhoto === "string") return firstPhoto;
  if (firstPhoto && typeof firstPhoto === "object" && typeof firstPhoto.url === "string") {
    return firstPhoto.url;
  }
  return NO_IMAGE_PLACEHOLDER;
}

export default function ExperienceList({
  experiences,
  selectedId = null,
  variant = "row",
  onExperienceClick,

  editButtons = false,
  onEditClick,
  onDeleteClick,
  deletingId = null,

  emptyMessage = "No experiences found.",
}: Props) {
  if (experiences.length === 0) return <p>{emptyMessage}</p>;

  const showEditButtons = editButtons && !!onEditClick && !!onDeleteClick;

  return (
    <div className={`search-results-container${variant === "card" ? " is-card-grid" : ""}`}>
      {experiences.map((exp) => {
        const isClickableCard = variant === "card" && !!onExperienceClick;
        return (
          <div
            key={exp.id}
            className={`experience-row ${
              selectedId === exp.id ? "experience-row-highlighted" : ""
            }${variant === "card" ? " is-card" : ""}`}
            onClick={
              isClickableCard ? () => onExperienceClick?.(exp.id) : undefined
            }
            role={isClickableCard ? "button" : undefined}
            tabIndex={isClickableCard ? 0 : undefined}
            onKeyDown={
              isClickableCard
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onExperienceClick?.(exp.id);
                    }
                  }
                : undefined
            }
          >
          <div className="experience-thumbnail">
            <img src={resolveImage(exp)} alt={exp.title} />
          </div>

          <div className="experience-body">
            <h2
              className="experience-title"
              onClick={variant !== "card" ? () => onExperienceClick?.(exp.id) : undefined}
              role={variant !== "card" && onExperienceClick ? "button" : undefined}
              tabIndex={variant !== "card" && onExperienceClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (!onExperienceClick || variant === "card") return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onExperienceClick(exp.id);
                }
              }}
            >
              {exp.title}
            </h2>

            <div className="experience-meta">
              {exp.city ? `${exp.city}, ` : ""}
              {exp.adminRegion ? `${exp.adminRegion}, ` : ""}
              {exp.country || "Global"} — {new Date(exp.dateCreated).toLocaleDateString()}
            </div>

            {/* Keep this safe if Explore adds distanceKm */}
            {typeof (exp as ExperienceWithDistance).distanceKm === "number" && (
              <div className="experience-distance">
                {(exp as ExperienceWithDistance).distanceKm?.toFixed(1)} km away
              </div>
            )}

            <p className="experience-description">
              {exp.description && exp.description.length > 160
                ? exp.description.substring(0, 160) + "..."
                : exp.description || "Discover more about this hidden gem..."}
            </p>

            <p className="experience-meta">
              <span aria-hidden="true" style={{ marginRight: 4 }}>
                👤
              </span>
              <strong>Created By:</strong> {exp.createdByUsername ?? "Unknown"}
            </p>

            {showEditButtons && (
              <div className="experience-actions" style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(exp.id);
                  }}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(exp.id);
                  }}
                  disabled={deletingId === exp.id}
                >
                  {deletingId === exp.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
          </div>
        );
      })}
    </div>
  );
}
