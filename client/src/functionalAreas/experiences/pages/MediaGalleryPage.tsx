import "./MediaGalleryPage.css";

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../../shared/services/api.service";

type RawPhoto = string | { url?: string | null } | null;
type GalleryLocationState = {
  photos?: RawPhoto[];
};

function normalizePhotos(photos: RawPhoto[] | null | undefined): string[] {
  if (!Array.isArray(photos)) return [];

  return photos
    .map((photo) => {
      if (typeof photo === "string" && photo.trim().length > 0) {
        return photo;
      }

      if (
        photo &&
        typeof photo === "object" &&
        typeof photo.url === "string" &&
        photo.url.trim().length > 0
      ) {
        return photo.url;
      }

      return null;
    })
    .filter((photo): photo is string => photo !== null);
}

// TODO: at some point, we should load images as wel scroll instead of loading all at once

export default function MediaGallery() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const statePhotos = useMemo(
    () =>
      normalizePhotos((location.state as GalleryLocationState | null)?.photos),
    [location.state],
  );

  const [photos, setPhotos] = useState<string[]>(statePhotos);
  const [isLoading, setIsLoading] = useState(statePhotos.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (statePhotos.length > 0) {
      setPhotos(statePhotos);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!id) {
      setPhotos([]);
      setIsLoading(false);
      setError("Missing experience ID.");
      return;
    }

    let canceled = false;
    setIsLoading(true);
    setError(null);

    apiClient
      .get(`/experiences/${id}`)
      .then((res) => {
        if (canceled) return;
        const fetchedPhotos = normalizePhotos(
          (res.data as { images?: RawPhoto[] } | null)?.images,
        );
        setPhotos(fetchedPhotos);
        setIsLoading(false);
      })
      .catch((err) => {
        if (canceled) return;
        console.error("Failed to load gallery photos:", err);
        setPhotos([]);
        setIsLoading(false);
        setError("Failed to load photos.");
      });

    return () => {
      canceled = true;
    };
  }, [id, statePhotos]);

  return (
    <div className="media-gallery-page">
      <div className="media-gallery-header">
        <button
          type="button"
          className="media-gallery-back-button"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <h1 className="media-gallery-title">All Photos</h1>
      </div>

      {isLoading && <p className="media-gallery-empty">Loading photos...</p>}

      {!isLoading && error && <p className="media-gallery-empty">{error}</p>}

      {!isLoading && !error && photos.length === 0 && (
        <p className="media-gallery-empty">
          No photos available for this experience yet.
        </p>
      )}

      {!isLoading && !error && photos.length > 0 && (
        <div className="media-gallery-masonry">
          {photos.map((photo, index) => (
            <img
              key={`${photo}-${index}`}
              src={photo}
              alt={`Photo ${index + 1}`}
              className="media-gallery-image"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPhoto(photo)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedPhoto(photo);
                }
              }}
            />
          ))}
        </div>
      )}

      {selectedPhoto && (
        <div
          className="lightbox-overlay"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Selected full-size"
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
