"use client";

import { useState, useRef } from "react";
import Image from "next/image";

/*
  MAGNIFYING GLASS COMPONENT

  The key fix vs the naive version: `object-cover` scales the image so the
  shorter dimension fills the container, cropping the longer one. If we
  naively set backgroundSize to containerWidth × zoom, the lens image gets
  stretched/squished to match the container's aspect ratio rather than the
  image's own ratio — causing the distortion and wrong-area problems.

  Correct approach:
  1. Read img.naturalWidth / naturalHeight to get the real image dimensions.
  2. Compute the object-cover scale: max(containerW / natW, containerH / natH).
  3. The rendered image is natW×scale by natH×scale, centred in the container,
     with (renderedW - containerW)/2 cropped on each side.
  4. Set backgroundSize to the rendered image × zoomLevel (preserves aspect ratio).
  5. Offset bgPosition by the crop amount so the lens shows the correct region.
*/

export default function ImageZoom({ src, alt, className = "" }) {
  const [showLens, setShowLens] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [backgroundPosition, setBackgroundPosition] = useState("0% 0%");
  const [backgroundSize, setBackgroundSize] = useState("0px 0px");
  const imgRef = useRef(null);

  const zoomLevel = 2.5;
  const lensSize = 200;
  const lensRadius = lensSize / 2;

  function handleMouseMove(e) {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    if (!showLens) setShowLens(true);

    const rect = img.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    setLensPosition({ x: cursorX, y: cursorY });

    // Replicate the object-cover scale factor
    const scale = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const renderedW = img.naturalWidth * scale;
    const renderedH = img.naturalHeight * scale;

    // How far the rendered image extends beyond the container on each axis
    const cropX = (renderedW - rect.width) / 2;
    const cropY = (renderedH - rect.height) / 2;

    // Background size matches the rendered (object-cover) image × zoom
    setBackgroundSize(`${renderedW * zoomLevel}px ${renderedH * zoomLevel}px`);

    // Place the cursor's rendered-image point at the centre of the lens
    const bgX = lensRadius - (cursorX + cropX) * zoomLevel;
    const bgY = lensRadius - (cursorY + cropY) * zoomLevel;
    setBackgroundPosition(`${bgX}px ${bgY}px`);
  }

  return (
    <div
      className={`relative overflow-hidden cursor-crosshair bg-gray-100 ${className}`}
      onMouseEnter={() => setShowLens(true)}
      onMouseLeave={() => setShowLens(false)}
      onMouseMove={handleMouseMove}
    >
      {src && (
        <Image
          ref={imgRef}
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      )}

      {src && showLens && (
        <div
          className="absolute pointer-events-none rounded-full border-2 border-white/70 shadow-lg"
          style={{
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            transform: "translate(-50%, -50%)",
            left: lensPosition.x,
            top: lensPosition.y,
            backgroundImage: `url(${src})`,
            backgroundSize: backgroundSize,
            backgroundPosition: backgroundPosition,
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  );
}
