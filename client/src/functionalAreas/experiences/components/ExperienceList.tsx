import type { Experience } from "../types/types";

type ExperienceWithDistance = Experience & {
  distanceKm?: number;
};

type Props = {
  experiences: Experience[];
  selectedId?: number | null;

  // Simple click callback
  onExperienceClick?: (id: number) => void;

  // Simple "edit buttons" option (only renders if true)
  editButtons?: boolean;
  onEditClick?: (id: number) => void;
  onDeleteClick?: (id: number) => void;
  deletingId?: number | null;

  emptyMessage?: string;
};

export default function ExperienceList({
  experiences,
  selectedId = null,
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
    <div className="search-results-container">
      {experiences.map((exp) => (
        <div
          key={exp.id}
          className={`experience-row ${
            selectedId === exp.id ? "experience-row-highlighted" : ""
          }`}
        >
          <div className="experience-thumbnail">
            {exp.thumbnail && <img src={exp.thumbnail} alt={exp.title} />}
          </div>

          <div className="experience-body">
            <h2
              className="experience-title"
              onClick={() => onExperienceClick?.(exp.id)}
              role={onExperienceClick ? "button" : undefined}
              tabIndex={onExperienceClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (!onExperienceClick) return;
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
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
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
      ))}
    </div>
  );
}