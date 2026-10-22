"use client";

import { useState } from "react";

export default function ProductGallery({ images, name, theme }: { images: string[]; name: string; theme: string }) {
  const [active, setActive] = useState(0);
  const selected = images[active] || images[0];

  return (
    <div className="product-gallery" id="product-gallery">
      <div className="product-gallery-main" style={{ background: theme }}>
        <img src={selected} alt={`${name} product preview`} />
      </div>

      <div className="gallery-thumbs">
        {images.map((image, index) => (
          <button
            key={image + index}
            className={index === active ? "active" : ""}
            type="button"
            aria-label={`View image ${index + 1}`}
            onClick={() => setActive(index)}
          >
            <img src={image} alt={`Product thumbnail ${index + 1}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
