import "./MediaGalleryPage.css";

import { useState } from "react";

type MediaGalleryProps = {
  photos: string[];
};

// TODO: at some point, we should load images as wel scroll instead of loading all at once

export default function MediaGallery(props: MediaGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <>
      <div className="media-gallery-masonry">
        {props.photos.map((photo, index) => (
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
    </>
  );
}
