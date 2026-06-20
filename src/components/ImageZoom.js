"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const ZOOM_LEVEL = 2.5;
const DESKTOP_LENS_SIZE = 200;
const TOUCH_LENS_MAX_SIZE = 168;
const TOUCH_LENS_MIN_SIZE = 132;
const TAP_MOVE_TOLERANCE = 10;
const TOUCH_LENS_GAP = 24;
const VIEWPORT_GAP = 8;

/*
  MAGNIFYING GLASS COMPONENT

  `object-cover` may crop the displayed image. The lens therefore reproduces
  the rendered image dimensions and crop offset instead of stretching the
  source to the container's aspect ratio.

  Mouse users retain hover-to-zoom. Touch users first tap to enter an explicit
  detail mode, then drag the lens. Keeping activation and dragging as separate
  gestures lets the first gesture remain available for ordinary page scrolling.
*/

export default function ImageZoom(props) {
  return <ImageZoomInteraction key={props.src || "empty-image"} {...props} />;
}

function ImageZoomInteraction({ src, alt, className = "" }) {
  const [showLens, setShowLens] = useState(false);
  const [touchZoomActive, setTouchZoomActive] = useState(false);
  const [lensStyle, setLensStyle] = useState({
    size: DESKTOP_LENS_SIZE,
    x: 0,
    y: 0,
    backgroundPosition: "0px 0px",
    backgroundSize: "0px 0px",
  });

  const rootRef = useRef(null);
  const surfaceRef = useRef(null);
  const imgRef = useRef(null);
  const touchCandidate = useRef(null);
  const touchLensSide = useRef("above");
  const activePointerId = useRef(null);
  const pendingLensMove = useRef(null);
  const moveFrame = useRef(null);

  useEffect(() => {
    if (!touchZoomActive) return;

    function handleOutsidePointerDown(e) {
      if (rootRef.current?.contains(e.target)) return;
      setTouchZoomActive(false);
      setShowLens(false);
      touchCandidate.current = null;
      activePointerId.current = null;
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
    };
  }, [touchZoomActive]);

  useEffect(() => () => {
    if (moveFrame.current !== null) cancelAnimationFrame(moveFrame.current);
  }, []);

  function updateLens(clientX, clientY, isTouch) {
    const img = imgRef.current;
    const surface = surfaceRef.current;
    if (!img || !surface || !img.naturalWidth) return;

    const rect = surface.getBoundingClientRect();
    const sampleX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const sampleY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const lensSize = isTouch
      ? Math.min(
          TOUCH_LENS_MAX_SIZE,
          Math.max(TOUCH_LENS_MIN_SIZE, rect.width * 0.44)
        )
      : DESKTOP_LENS_SIZE;
    const lensRadius = lensSize / 2;

    let lensX = sampleX;
    let lensY = sampleY;

    if (isTouch) {
      // The touch lens may leave the artwork frame. Clamp it only to the
      // viewport, and keep it on the side chosen when zoom mode activated.
      // This prevents the lens from repeatedly flipping above and below the
      // finger while the sampled point moves near an artwork edge.
      const minLensX = VIEWPORT_GAP - rect.left + lensRadius;
      const maxLensX = window.innerWidth - VIEWPORT_GAP - rect.left - lensRadius;
      const minLensY = VIEWPORT_GAP - rect.top + lensRadius;
      const maxLensY = window.innerHeight - VIEWPORT_GAP - rect.top - lensRadius;
      const desiredLensY = touchLensSide.current === "above"
        ? sampleY - lensRadius - TOUCH_LENS_GAP
        : sampleY + lensRadius + TOUCH_LENS_GAP;

      lensX = Math.max(minLensX, Math.min(maxLensX, sampleX));
      lensY = Math.max(minLensY, Math.min(maxLensY, desiredLensY));
    }

    const scale = Math.max(
      rect.width / img.naturalWidth,
      rect.height / img.naturalHeight
    );
    const renderedW = img.naturalWidth * scale;
    const renderedH = img.naturalHeight * scale;
    const cropX = (renderedW - rect.width) / 2;
    const cropY = (renderedH - rect.height) / 2;

    // Centre the touched/hovered source point in the lens, even when the touch
    // lens is visually offset so that the user's finger does not cover it.
    const bgX = lensRadius - (sampleX + cropX) * ZOOM_LEVEL;
    const bgY = lensRadius - (sampleY + cropY) * ZOOM_LEVEL;

    setLensStyle({
      size: lensSize,
      x: lensX,
      y: lensY,
      backgroundPosition: `${bgX}px ${bgY}px`,
      backgroundSize: `${renderedW * ZOOM_LEVEL}px ${renderedH * ZOOM_LEVEL}px`,
    });
  }

  function queueLensUpdate(clientX, clientY, isTouch) {
    pendingLensMove.current = { clientX, clientY, isTouch };
    if (moveFrame.current !== null) return;

    moveFrame.current = requestAnimationFrame(() => {
      moveFrame.current = null;
      const pending = pendingLensMove.current;
      pendingLensMove.current = null;
      if (pending) updateLens(pending.clientX, pending.clientY, pending.isTouch);
    });
  }

  function chooseTouchLensSide(clientY) {
    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const lensSize = Math.min(
      TOUCH_LENS_MAX_SIZE,
      Math.max(TOUCH_LENS_MIN_SIZE, rect.width * 0.44)
    );

    // Once selected, the side remains stable until detail mode closes.
    const spaceNeededAbove = lensSize + TOUCH_LENS_GAP + VIEWPORT_GAP;
    touchLensSide.current = clientY >= spaceNeededAbove ? "above" : "below";
  }

  function handlePointerEnter(e) {
    if (e.pointerType !== "mouse" || touchZoomActive) return;
    setShowLens(true);
    queueLensUpdate(e.clientX, e.clientY, false);
  }

  function handlePointerLeave(e) {
    if (e.pointerType === "mouse" && !touchZoomActive) setShowLens(false);
  }

  function handlePointerDown(e) {
    if (e.pointerType === "mouse" || !src) return;

    if (touchZoomActive) {
      if (activePointerId.current !== null) return;
      activePointerId.current = e.pointerId;
      setShowLens(true);
      queueLensUpdate(e.clientX, e.clientY, true);
      return;
    }

    // The first gesture remains scroll-friendly. Zoom activates only after it
    // finishes as a clean tap; a drag here continues to scroll the page.
    touchCandidate.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  }

  function handlePointerMove(e) {
    if (e.pointerType === "mouse") {
      if (touchZoomActive) return;
      if (!showLens) setShowLens(true);
      queueLensUpdate(e.clientX, e.clientY, false);
      return;
    }

    if (touchZoomActive) {
      if (activePointerId.current !== e.pointerId) return;
      queueLensUpdate(e.clientX, e.clientY, true);
      return;
    }

    const candidate = touchCandidate.current;
    if (!candidate || candidate.pointerId !== e.pointerId || candidate.moved) return;

    if (
      Math.hypot(
        e.clientX - candidate.startX,
        e.clientY - candidate.startY
      ) >= TAP_MOVE_TOLERANCE
    ) {
      candidate.moved = true;
    }
  }

  function handlePointerUp(e) {
    if (e.pointerType === "mouse") return;

    if (touchZoomActive) {
      if (activePointerId.current !== e.pointerId) return;
      queueLensUpdate(e.clientX, e.clientY, true);
      activePointerId.current = null;
      return;
    }

    const candidate = touchCandidate.current;
    if (!candidate || candidate.pointerId !== e.pointerId) return;
    touchCandidate.current = null;

    if (candidate.moved) return;

    chooseTouchLensSide(e.clientY);
    setTouchZoomActive(true);
    setShowLens(true);
    queueLensUpdate(e.clientX, e.clientY, true);
  }

  function handlePointerCancel(e) {
    if (touchCandidate.current?.pointerId === e.pointerId) {
      touchCandidate.current = null;
    }
    if (activePointerId.current === e.pointerId) {
      activePointerId.current = null;
    }
  }

  function renderLens() {
    return (
      <div
        className="absolute z-10 pointer-events-none rounded-full border-2 border-white/70 shadow-lg"
        aria-hidden="true"
        style={{
          width: `${lensStyle.size}px`,
          height: `${lensStyle.size}px`,
          transform: "translate(-50%, -50%)",
          left: lensStyle.x,
          top: lensStyle.y,
          backgroundImage: `url(${src})`,
          backgroundSize: lensStyle.backgroundSize,
          backgroundPosition: lensStyle.backgroundPosition,
          backgroundRepeat: "no-repeat",
        }}
      />
    );
  }

  return (
    <div ref={rootRef}>
      <p className="mb-3 text-sm text-[var(--color-accent)]">
        <span className="zoom-hint-fine">
          Come a little closer - <span aria-hidden="true">{"\u{1F50D}"}</span> Hover to explore the brushstrokes
        </span>
        <span className="zoom-hint-touch">
          Come a little closer - <span aria-hidden="true">{"\u{1F50D}"}</span> Tap the artwork, then drag to explore its details
        </span>
      </p>

      <div
        ref={surfaceRef}
        className={`relative cursor-crosshair select-none ${className}`}
        style={{
          touchAction: touchZoomActive ? "none" : "pan-y pinch-zoom",
          WebkitTouchCallout: touchZoomActive ? "none" : "default",
        }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => {
          if (touchZoomActive) e.preventDefault();
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden bg-gray-100 pointer-events-none"
          style={{ borderRadius: "inherit" }}
        >
          {src && (
            <Image
              ref={imgRef}
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover pointer-events-none"
              draggable={false}
            />
          )}

          {src && showLens && !touchZoomActive && renderLens()}
        </div>

        {src && touchZoomActive && (
          <div
            className="absolute z-20 top-3 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] rounded-full bg-black/65 px-3 py-1.5 text-center text-xs text-white shadow-md pointer-events-none"
            aria-live="polite"
          >
            Detail view - drag to wander - tap outside to close
          </div>
        )}

        {src && showLens && touchZoomActive && renderLens()}
      </div>
    </div>
  );
}
