"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const THUMB_W = 80;
const GAP = 8;
const SLOT = THUMB_W + GAP;

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L6 8l4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l4 5-4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getSrc(img) {
  return typeof img === "string" ? img : img.url;
}

export default function ThumbnailStrip({ images, selectedIndex, onSelect }) {
  const [dragging, setDragging] = useState(false);
  // Track actual container width so visibleCount adapts to mobile/desktop.
  const [containerW, setContainerW] = useState(0);

  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const currentT = useRef(0);
  const dragStartX = useRef(null);
  const dragStartT = useRef(0);
  const wasDragged = useRef(false);

  const total = images?.length ?? 0;
  // How many thumbnails actually fit in the measured container width.
  const visibleCount = containerW > 0 ? Math.max(1, Math.floor((containerW + GAP) / SLOT)) : 5;
  const minT = total > visibleCount ? -(total - visibleCount) * SLOT : 0;
  const maxT = 0;

  // Measure container width and keep it updated on resize.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function applyTranslate(x) {
    currentT.current = x;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${x}px)`;
  }

  // Keep the selected thumbnail in view, plus a one-thumbnail "peek" of its
  // neighbours when they exist — so selecting the last visible thumb scrolls the
  // next hidden image into view (and you can keep walking through to the end).
  useEffect(() => {
    if (total <= visibleCount) return;
    const firstVisible = Math.round(-currentT.current / SLOT);
    const lastVisible = firstVisible + visibleCount - 1;
    let newFirst = firstVisible;
    if (selectedIndex + 1 > lastVisible) {
      // selection at/over the right edge → advance so the next image peeks in
      newFirst = selectedIndex + 2 - visibleCount;
    } else if (selectedIndex - 1 < firstVisible) {
      // selection at/over the left edge → step back so the previous image peeks in
      newFirst = selectedIndex - 1;
    }
    newFirst = Math.max(0, Math.min(total - visibleCount, newFirst));
    applyTranslate(Math.max(minT, Math.min(maxT, -newFirst * SLOT)));
  }, [selectedIndex, total, visibleCount, minT, maxT]);

  // Window-level drag listeners
  useEffect(() => {
    if (!dragging) return;

    function handleMove(e) {
      const delta = e.clientX - dragStartX.current;
      if (Math.abs(delta) > 5) wasDragged.current = true;
      applyTranslate(Math.max(minT, Math.min(maxT, dragStartT.current + delta)));
    }

    function handleUp() {
      setDragging(false);
      const snapIndex = Math.round(-currentT.current / SLOT);
      const clamped = Math.max(0, Math.min(total - visibleCount, snapIndex));
      applyTranslate(-clamped * SLOT);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, minT, maxT, total, visibleCount]);

  if (!images || total <= 1) return null;

  function handleMouseDown(e) {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartT.current = currentT.current;
    wasDragged.current = false;
    setDragging(true);
  }

  function handleThumbClick(i) {
    if (wasDragged.current) {
      wasDragged.current = false;
      return;
    }
    onSelect(i);
  }

  function renderThumb(img, i) {
    const selected = selectedIndex === i;
    return (
      <button
        key={i}
        onClick={() => handleThumbClick(i)}
        className={`flex-shrink-0 rounded-lg overflow-hidden relative transition-all select-none ${
          selected ? "ring-2 ring-gray-900 opacity-100" : "opacity-60 hover:opacity-100"
        }`}
        style={{ width: THUMB_W, height: THUMB_W }}
      >
        <Image
          src={getSrc(img)}
          alt={`View ${i + 1}`}
          fill
          sizes="80px"
          className="object-cover pointer-events-none"
          draggable={false}
        />
      </button>
    );
  }

  if (total <= visibleCount) {
    return (
      <div className="mt-4 flex gap-2 justify-center">
        {images.map((img, i) => renderThumb(img, i))}
      </div>
    );
  }

  const canLeft = selectedIndex > 0;
  const canRight = selectedIndex < total - 1;

  return (
    <div className="mt-4 flex items-center gap-2 justify-center">
      <button
        onClick={() => onSelect(Math.max(selectedIndex - 1, 0))}
        disabled={!canLeft}
        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
          canLeft ? "text-gray-700 hover:bg-gray-100" : "text-gray-300"
        }`}
      >
        <ChevronLeft />
      </button>

      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg flex-1"
        style={{ maxWidth: containerW > 0 ? `${visibleCount * SLOT - GAP}px` : undefined }}
      >
        <div
          ref={trackRef}
          className={`flex gap-2 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            transition: dragging ? "none" : "transform 0.22s ease-out",
            willChange: "transform",
          }}
          onMouseDown={handleMouseDown}
        >
          {images.map((img, i) => renderThumb(img, i))}
        </div>
      </div>

      <button
        onClick={() => onSelect(Math.min(selectedIndex + 1, total - 1))}
        disabled={!canRight}
        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
          canRight ? "text-gray-700 hover:bg-gray-100" : "text-gray-300"
        }`}
      >
        <ChevronRight />
      </button>
    </div>
  );
}
