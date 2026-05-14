import "./MediaGalleryPage.css";

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../../shared/services/api.service";

type RawImage =
  | string
  | {
      id?: string | number;
      url?: string | null;
      mimeType?: string | null;
      mediaType?: "IMAGE" | "VIDEO";
    }
  | null;

type RawMedia = {
  id?: string | number;
  url?: string | null;
  type?: "image" | "video";
  mediaType?: "IMAGE" | "VIDEO";
  mimeType?: string | null;
} | null;

type MediaItem = {
  id: string | number;
  url: string;
  type: "image" | "video";
};

type GalleryLocationState = {
  media?: MediaItem[];
};

function normalizeMedia(
  media: RawMedia[] | null | undefined,
  images: RawImage[] | null | undefined,
): MediaItem[] {
  if (Array.isArray(media) && media.length > 0) {
    return media
      .map((item) => {
        if (!item || typeof item.url !== "string" || item.url.trim().length === 0) {
          return null;
        }

        const type =
          item.type === "video" || item.mediaType === "VIDEO" ? "video" : "image";

        return {
          id: item.id ?? item.url,
          url: item.url.trim(),
          type,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  if (!Array.isArray(images)) return [];

  return images
    .map((item) => {
      if (typeof item === "string" && item.trim().length > 0) {
        return {
          id: item,
          url: item,
          type: "image" as const,
        };
      }

      if (item && typeof item === "object" && typeof item.url === "string") {
        const type = item.mediaType === "VIDEO" ? "video" : "image";
        return {
          id: item.id ?? item.url,
          url: item.url,
          type,
        };
      }

      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

// TODO: at some point, we should load media as we scroll instead of all at once.

export default function MediaGallery() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const stateMedia = useMemo(() => {
    const media = (location.state as GalleryLocationState | null)?.media;
    if (!Array.isArray(media)) return [];

    return media.filter(
      (item): item is MediaItem =>
        typeof item?.url === "string" &&
        item.url.trim().length > 0 &&
        (item.type === "image" || item.type === "video"),
    );
  }, [location.state]);

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(stateMedia);
  const [isLoading, setIsLoading] = useState(stateMedia.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (stateMedia.length > 0) {
      setMediaItems(stateMedia);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!id) {
      setMediaItems([]);
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
        const body = res.data as {
          media?: RawMedia[];
          images?: RawImage[];
        } | null;

        const fetchedMedia = normalizeMedia(body?.media, body?.images);
        setMediaItems(fetchedMedia);
        setIsLoading(false);
      })
      .catch((err) => {
        if (canceled) return;
        console.error("Failed to load gallery media:", err);
        setMediaItems([]);
        setIsLoading(false);
        setError("Failed to load media.");
      });

    return () => {
      canceled = true;
    };
  }, [id, stateMedia]);

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
        <h1 className="media-gallery-title">All Media</h1>
      </div>

      {isLoading && <p className="media-gallery-empty">Loading media...</p>}

      {!isLoading && error && <p className="media-gallery-empty">{error}</p>}

      {!isLoading && !error && mediaItems.length === 0 && (
        <p className="media-gallery-empty">
          No media available for this experience yet.
        </p>
      )}

      {!isLoading && !error && mediaItems.length > 0 && (
        <div className="media-gallery-masonry">
          {mediaItems.map((item, index) =>
            item.type === "video" ? (
              <video
                key={`${item.id}-${index}`}
                src={item.url}
                className="media-gallery-image"
                controls
                preload="metadata"
                onClick={() => setSelectedMedia(item)}
              />
            ) : (
              <img
                key={`${item.id}-${index}`}
                src={item.url}
                alt={`Media ${index + 1}`}
                className="media-gallery-image"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedMedia(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedMedia(item);
                  }
                }}
              />
            ),
          )}
        </div>
      )}

      {selectedMedia && (
        <div className="lightbox-overlay" onClick={() => setSelectedMedia(null)}>
          {selectedMedia.type === "video" ? (
            <video
              src={selectedMedia.url}
              className="lightbox-image"
              controls
              preload="metadata"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={selectedMedia.url}
              alt="Selected full-size"
              className="lightbox-image"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
