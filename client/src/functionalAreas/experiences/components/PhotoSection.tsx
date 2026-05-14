import "./PhotoSection.css";
import { useNavigate } from "react-router-dom";

type MediaItem = {
  id: string | number;
  url: string;
  type: "image" | "video";
  alt?: string;
};

type PhotoSectionProps = {
  id: string | number;
  title: string;
  thumbnail?: string;
  media: MediaItem[];
};

export default function PhotoSection(props: PhotoSectionProps) {
  const navigate = useNavigate();

  const validMedia = (props.media ?? []).filter(
    (item): item is MediaItem =>
      typeof item.url === "string" && item.url.trim().length > 0,
  );

  const imageMedia = validMedia.filter((item) => item.type === "image");
  const videoMedia = validMedia.filter((item) => item.type === "video");

  const extraPhotos = imageMedia
    .map((item) => item.url)
    .filter((photo) => photo !== props.thumbnail)
    .slice(0, 2);
  const hasMultiplePhotos = extraPhotos.length > 0;
  const firstVideo = videoMedia[0];

  return (
    <>
      {props.thumbnail ? (
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
            onClick={() => navigate("photos", { state: { media: validMedia } })}
          >
            All Media {validMedia.length}
          </button>
        </div>
      ) : firstVideo ? (
        <div className="detail-image-wrap detail-image-wrap--collage">
          <video
            className="detail-image-main detail-image-main--solo"
            src={firstVideo.url}
            controls
            preload="metadata"
          />
          <button
            type="button"
            className="media-overlay-button"
            onClick={() => navigate("photos", { state: { media: validMedia } })}
          >
            All Media {validMedia.length}
          </button>
        </div>
      ) : null}
    </>
  );
}
