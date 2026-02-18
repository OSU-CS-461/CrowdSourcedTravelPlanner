import { Link } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";

type ExperienceTag = {
  id: number | string;
  label: string;
  slug: string;
  type: "CATEGORY" | "FEATURE";
  parentCategoryId?: number | null;
};

export type Experience = {
  id?: number | string;
  title?: string | null;
  description?: string | null;
  dateCreated?: string | null;
  thumbnail?: string | null;
  keywords?: string[] | string | null;
  country?: string | null;
  adminRegion?: string | null;
  city?: string | null;
  street?: string | null;
  postalCode?: string | null;
  categoryTags?: ExperienceTag[] | null;
  featureTags?: ExperienceTag[] | null;
};

interface ExperienceCardProps {
  experience: Experience;
}

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
  const keywords = Array.isArray(experience.keywords)
    ? experience.keywords
    : experience.keywords
      ? experience.keywords.split(",").map((keyword) => keyword.trim())
      : [];
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
      {keywords.length ? <p>{keywords.join(", ")}</p> : null}
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
