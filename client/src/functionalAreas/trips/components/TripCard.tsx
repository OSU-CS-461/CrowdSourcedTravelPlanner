import { Link } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";

export type Trip = {
  id?: number | string;
  title?: string | null;
  description?: string | null;
  dateCreated?: string | null;
};

interface TripCardProps {
  trip: Trip;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function TripCard({ trip }: TripCardProps) {
  const title = trip.title?.trim() || "Untitled trip";
  const description = trip.description?.trim();
  const date = formatDate(trip.dateCreated);

  const updateHref =
    trip.id !== undefined && trip.id !== null
      ? ClientRoutes.TRIP_UPDATE.replace(":id", String(trip.id))
      : null;

  return (
    <article className="experience-card"> {/* reuse same styling */}
      <h3>{title}</h3>

      {description ? <p>{description}</p> : null}
      {date ? <p>{date}</p> : null}

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