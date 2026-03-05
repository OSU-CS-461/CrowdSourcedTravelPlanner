import { Link } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import { type Experience, type ExperienceCardProps } from "../types/types.ts"



function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatLocation(experience: Experience) {
  const parts = [
    experience.street,
    experience.city,
    experience.adminRegion,
    experience.postalCode,
    experience.country,
  ].filter((part) => typeof part === "string" && part.trim().length > 0);

  return parts.length ? parts.join(", ") : null;
}

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  const title = experience.title?.trim() || "Untitled experience";
  const description = experience.description?.trim();
  const date = formatDate(experience.dateCreated);
  const location = formatLocation(experience);
  const categories = experience.categoryTags ?? [];
  const features = experience.featureTags ?? [];
  const updateHref =
    experience.id !== undefined && experience.id !== null
      ? ClientRoutes.EXPERIENCE_UPDATE.replace(":id", String(experience.id))
      : null;

  return (
    <article className="experience-card">
      <h3>{title}</h3>
      <img className="photo" src={experience.thumbnail || ""} alt={title} />
      {description ? <p>{description}</p> : null}
      {date ? <p>{date}</p> : null}
      {location ? <p>{location}</p> : null}
      <p>
        <span aria-hidden="true" style={{ marginRight: 4 }}>👤</span>
        <strong>Created By:</strong> {experience.createdByUsername ?? "Unknown"}
      </p>
      {categories.length ? (
        <p>
          <strong>Category:</strong> {categories.map((tag) => tag.label).join(", ")}
        </p>
      ) : null}
      {features.length ? (
        <p>
          <strong>Features:</strong> {features.map((tag) => tag.label).join(", ")}
        </p>
      ) : null}
      {updateHref ? (
        <div className="card-actions">
          <Link className="card-edit-button" to={updateHref}>
            Edit
          </Link>
        </div>
      ) : null}
    </article>
  );
}
