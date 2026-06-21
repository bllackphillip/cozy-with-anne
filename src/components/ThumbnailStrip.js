"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const THUMB_W = 80;
const GAP = 8;
const SLOT = THUMB_W + GAP;
const ARROW_W = 32;
const CONTROLS_W = ARROW_W * 2 + GAP * 2;
const MOUSE_DRAG_THRESHOLD = 5;

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
  const [rowW, setRowW] = useState(0);

  const rowRef = useRef(null);
  const viewportRef = useRef(null);

  const mousePointerId = useRef(null);
  const mouseStartX = useRef(0);
  const mouseStartScrollLeft = useRef(0);
  const mouseDragged = useRef(false);
  const suppressMouseClick = useRef(false);
  const suppressMouseClickTimer = useRef(null);

  const total = images?.length ?? 0;
  const visibleWithoutControls = rowW > 0
    ? Math.max(1, Math.floor((rowW + GAP) / SLOT))
    : total;
  const hasOverflow = rowW > 0 && total > visibleWithoutControls;
  const viewportW = hasOverflow ? Math.max(THUMB_W, rowW - CONTROLS_W) : rowW;
  const visibleCount = rowW > 0
    ? Math.max(1, Math.floor((viewportW + GAP) / SLOT))
    : total;

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const observer = new ResizeObserver(([entry]) => {
      setRowW(entry.contentRect.width);
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, [total]);

  useEffect(() => () => {
    if (suppressMouseClickTimer.current !== null) {
      clearTimeout(suppressMouseClickTimer.current);
    }
  }, []);

  // Preserve the existing one-thumbnail peek when selection changes through a
  // thumbnail tap or arrow. Manual touch scrolling remains fully free-moving.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !hasOverflow) return;

    const firstVisible = Math.round(viewport.scrollLeft / SLOT);
    const lastVisible = firstVisible + visibleCount - 1;
    let newFirst = firstVisible;

    if (selectedIndex + 1 > lastVisible) {
      newFirst = selectedIndex + 2 - visibleCount;
    } else if (selectedIndex - 1 < firstVisible) {
      newFirst = selectedIndex - 1;
    }

    newFirst = Math.max(0, Math.min(total - visibleCount, newFirst));
    const targetLeft = newFirst * SLOT;
    if (Math.abs(targetLeft - viewport.scrollLeft) > 1) {
      viewport.scrollTo({ left: targetLeft, behavior: "smooth" });
    }
  }, [selectedIndex, total, visibleCount, hasOverflow]);

  if (!images || total <= 1) return null;

  function clearMouseClickSuppression() {
    suppressMouseClick.current = false;
    if (suppressMouseClickTimer.current !== null) {
      clearTimeout(suppressMouseClickTimer.current);
      suppressMouseClickTimer.current = null;
    }
  }

  function suppressImmediateMouseClick() {
    suppressMouseClick.current = true;
    if (suppressMouseClickTimer.current !== null) {
      clearTimeout(suppressMouseClickTimer.current);
    }
    suppressMouseClickTimer.current = window.setTimeout(() => {
      suppressMouseClick.current = false;
      suppressMouseClickTimer.current = null;
    }, 500);
  }

  function handlePointerDown(e) {
    if (
      e.pointerType !== "mouse" ||
      e.button !== 0 ||
      mousePointerId.current !== null ||
      !hasOverflow
    ) {
      return;
    }

    clearMouseClickSuppression();
    mousePointerId.current = e.pointerId;
    mouseStartX.current = e.clientX;
    mouseStartScrollLeft.current = viewportRef.current?.scrollLeft ?? 0;
    mouseDragged.current = false;
  }

  function handlePointerMove(e) {
    if (e.pointerType !== "mouse" || mousePointerId.current !== e.pointerId) return;

    const delta = e.clientX - mouseStartX.current;
    if (!mouseDragged.current) {
      if (Math.abs(delta) < MOUSE_DRAG_THRESHOLD) return;
      mouseDragged.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    e.preventDefault();
    e.currentTarget.scrollLeft = mouseStartScrollLeft.current - delta;
  }

  function finishMousePointer(e) {
    if (e.pointerType !== "mouse" || mousePointerId.current !== e.pointerId) return;

    const didDrag = mouseDragged.current;
    mousePointerId.current = null;
    mouseDragged.current = false;
    setDragging(false);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (didDrag) suppressImmediateMouseClick();
  }

  function handleClickCapture(e) {
    if (!suppressMouseClick.current) return;
    clearMouseClickSuppression();
    e.preventDefault();
    e.stopPropagation();
  }

  function renderThumb(img, index) {
    const selected = selectedIndex === index;
    return (
      <button
        key={index}
        onClick={() => onSelect(index)}
        className={`flex-shrink-0 rounded-lg overflow-hidden relative transition-all select-none ${
          selected ? "ring-2 ring-gray-900 opacity-100" : "opacity-60 hover:opacity-100"
        }`}
        style={{ width: THUMB_W, height: THUMB_W }}
      >
        <Image
          src={getSrc(img)}
          alt={`View ${index + 1}`}
          fill
          sizes="80px"
          className="object-cover pointer-events-none"
          draggable={false}
        />
      </button>
    );
  }

  const canLeft = selectedIndex > 0;
  const canRight = selectedIndex < total - 1;
  const measuredWidth = rowW > 0
    ? Math.min(total, visibleCount) * SLOT - GAP
    : undefined;

  return (
    <div ref={rowRef} className="mt-4 flex w-full items-center gap-2 justify-center">
      {hasOverflow && (
        <button
          onClick={() => onSelect(Math.max(selectedIndex - 1, 0))}
          disabled={!canLeft}
          aria-label="Previous image"
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            canLeft ? "text-gray-700 hover:bg-gray-100" : "text-gray-300"
          }`}
        >
          <ChevronLeft />
        </button>
      )}

      <div
        ref={viewportRef}
        className={`overflow-x-auto overflow-y-hidden rounded-lg flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          hasOverflow ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
        }`}
        style={{
          maxWidth: measuredWidth ? `${measuredWidth}px` : undefined,
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y pinch-zoom",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishMousePointer}
        onPointerCancel={finishMousePointer}
        onClickCapture={handleClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="flex w-max gap-2">
          {images.map((img, index) => renderThumb(img, index))}
        </div>
      </div>

      {hasOverflow && (
        <button
          onClick={() => onSelect(Math.min(selectedIndex + 1, total - 1))}
          disabled={!canRight}
          aria-label="Next image"
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            canRight ? "text-gray-700 hover:bg-gray-100" : "text-gray-300"
          }`}
        >
          <ChevronRight />
        </button>
      )}
    </div>
  );
}
