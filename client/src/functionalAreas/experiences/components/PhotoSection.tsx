import "./PhotoSection.css";
import { useNavigate } from "react-router-dom";

type PhotoSectionProps = {
  id: string | number;
  title: string;
  thumbnail?: string;
  photos: string[];
};

export default function PhotoSection(props: PhotoSectionProps) {
  const navigate = useNavigate();

  const validPhotos = (props.photos ?? []).filter(
    (photo): photo is string =>
      typeof photo === "string" && photo.trim().length > 0,
  );

  const extraPhotos = validPhotos
    .filter((photo) => photo !== props.thumbnail)
    .slice(0, 2);
  const hasMultiplePhotos = extraPhotos.length > 0;

  return (
    <>
      {props.thumbnail && (
        <div
          className={`detail-image-wrap ${
            hasMultiplePhotos ? "detail-image-wrap--collage" : ""
          }`}
        >
          <img
            className={`detail-image-main ${
              !hasMultiplePhotos ? "detail-image-main--solo" : ""
            }`}
            src={props.thumbnail}
            alt={props.title}
          />

          {hasMultiplePhotos && (
            <div className="detail-image-stack">
              {extraPhotos.map((photo, index) => (
                <img
                  key={`${photo}-${index}`}
                  src={photo}
                  alt={`${props.title} photo ${index + 2}`}
                  className="detail-image-secondary"
                />
              ))}
            </div>
          )}

          <button
            type="button"
            className="media-overlay-button"
            onClick={() =>
              navigate("photos", { state: { photos: validPhotos } })
            }
          >
            All Photos {validPhotos.length}
          </button>
        </div>
      )}
    </>
  );
}
