"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const THUMB_W = 80;
const GAP = 8;
const SLOT = THUMB_W + GAP;
const ARROW_W = 32;
const CONTROLS_W = ARROW_W * 2 + GAP * 2;
const MOUSE_DRAG_THRESHOLD = 5;
const TOUCH_DRAG_THRESHOLD = 10;
const SNAP_DURATION = 220;
const SNAP_EASING = "ease-out";
const TOUCH_MOMENTUM_PROJECTION = 180;
const TOUCH_MOMENTUM_MIN_VELOCITY = 0.08;
const TOUCH_MOMENTUM_MAX_AGE = 80;
const TOUCH_MOMENTUM_MIN_DURATION = 160;
const TOUCH_MOMENTUM_MAX_DURATION = 420;
const TOUCH_MOMENTUM_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const DRAG_CLICK_SUPPRESSION_TIMEOUT = 500;

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

function renderedTranslateX(element) {
  const transform = window.getComputedStyle(element).transform;
  if (!transform || transform === "none") return 0;

  const values = transform
    .slice(transform.indexOf("(") + 1, transform.lastIndexOf(")"))
    .split(",")
    .map(Number);
  return transform.startsWith("matrix3d") ? values[12] : values[4];
}

export default function ThumbnailStrip({ images, selectedIndex, onSelect }) {
  const [dragging, setDragging] = useState(false);
  const [rowW, setRowW] = useState(0);

  const trackRef = useRef(null);
  const rowRef = useRef(null);
  const currentT = useRef(0);
  const pointerId = useRef(null);
  const dragStartX = useRef(0);
  const dragStartT = useRef(0);
  const dragThreshold = useRef(MOUSE_DRAG_THRESHOLD);
  const activePointerType = useRef(null);
  const wasDragged = useRef(false);
  const lastMoveX = useRef(0);
  const lastMoveAt = useRef(0);
  const touchVelocity = useRef(0);
  const suppressClick = useRef(false);
  const suppressClickTimer = useRef(null);
  const pendingT = useRef(null);
  const moveFrame = useRef(null);
  const momentumFrame = useRef(null);

  const total = images?.length ?? 0;
  const visibleWithoutControls = rowW > 0
    ? Math.max(1, Math.floor((rowW + GAP) / SLOT))
    : total;
  const hasOverflow = rowW > 0 && total > visibleWithoutControls;
  const viewportW = hasOverflow ? Math.max(THUMB_W, rowW - CONTROLS_W) : rowW;
  const visibleCount = rowW > 0
    ? Math.max(1, Math.floor((viewportW + GAP) / SLOT))
    : total;
  const minT = hasOverflow ? -(total - visibleCount) * SLOT : 0;
  const maxT = 0;

  // The viewport is always mounted, including for short galleries. This is
  // important on mobile: deciding whether thumbnails overflow requires a real
  // measurement rather than the old hard-coded assumption that five fit.
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setRowW(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [total]);

  useEffect(() => () => {
    if (moveFrame.current !== null) cancelAnimationFrame(moveFrame.current);
    if (momentumFrame.current !== null) cancelAnimationFrame(momentumFrame.current);
    if (suppressClickTimer.current !== null) {
      clearTimeout(suppressClickTimer.current);
    }
  }, []);

  function applyTranslate(x, animate = false, duration = SNAP_DURATION, easing = SNAP_EASING) {
    currentT.current = x;
    if (!trackRef.current) return;
    trackRef.current.style.transition = animate
      ? `transform ${duration}ms ${easing}`
      : "none";
    trackRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
  }

  function cancelQueuedMove() {
    if (moveFrame.current !== null) cancelAnimationFrame(moveFrame.current);
    moveFrame.current = null;
    pendingT.current = null;
  }

  function cancelMomentumFrame() {
    if (momentumFrame.current !== null) {
      cancelAnimationFrame(momentumFrame.current);
      momentumFrame.current = null;
    }
  }

  function queueTranslate(x) {
    pendingT.current = x;
    if (moveFrame.current !== null) return;

    moveFrame.current = requestAnimationFrame(() => {
      moveFrame.current = null;
      if (pendingT.current !== null) applyTranslate(pendingT.current);
      pendingT.current = null;
    });
  }

  // Preserve the existing one-thumbnail peek: selecting the last visible item
  // reveals the next item, and selecting the first reveals the previous item.
  useEffect(() => {
    if (pointerId.current !== null) return;

    if (!hasOverflow) {
      applyTranslate(0, true);
      return;
    }

    const firstVisible = Math.round(-currentT.current / SLOT);
    const lastVisible = firstVisible + visibleCount - 1;
    let newFirst = firstVisible;

    if (selectedIndex + 1 > lastVisible) {
      newFirst = selectedIndex + 2 - visibleCount;
    } else if (selectedIndex - 1 < firstVisible) {
      newFirst = selectedIndex - 1;
    }

    newFirst = Math.max(0, Math.min(total - visibleCount, newFirst));
    applyTranslate(Math.max(minT, Math.min(maxT, -newFirst * SLOT)), true);
  }, [selectedIndex, total, visibleCount, hasOverflow, minT]);

  if (!images || total <= 1) return null;

  function snapToClosestSlot() {
    const snapIndex = Math.round(-currentT.current / SLOT);
    const clamped = Math.max(0, Math.min(total - visibleCount, snapIndex));
    applyTranslate(-clamped * SLOT, true);
  }

  function clearClickSuppression() {
    suppressClick.current = false;
    if (suppressClickTimer.current !== null) {
      clearTimeout(suppressClickTimer.current);
      suppressClickTimer.current = null;
    }
  }

  function suppressDragClick() {
    suppressClick.current = true;
    if (suppressClickTimer.current !== null) {
      clearTimeout(suppressClickTimer.current);
    }
    // Pointerdown from a new gesture clears this immediately. The timeout is
    // only a fallback for keyboard activation or browsers that emit no click
    // after the completed drag.
    suppressClickTimer.current = window.setTimeout(() => {
      suppressClick.current = false;
      suppressClickTimer.current = null;
    }, DRAG_CLICK_SUPPRESSION_TIMEOUT);
  }

  function coastTouchStrip(finalT, releasedAt) {
    const velocityIsFresh = releasedAt - lastMoveAt.current <= TOUCH_MOMENTUM_MAX_AGE;
    const velocity = velocityIsFresh ? touchVelocity.current : 0;
    if (Math.abs(velocity) < TOUCH_MOMENTUM_MIN_VELOCITY) {
      applyTranslate(finalT);
      return;
    }

    const target = Math.max(
      minT,
      Math.min(maxT, finalT + velocity * TOUCH_MOMENTUM_PROJECTION)
    );
    const distance = Math.abs(target - finalT);
    if (distance < 1) {
      applyTranslate(finalT);
      return;
    }

    const duration = Math.max(
      TOUCH_MOMENTUM_MIN_DURATION,
      Math.min(TOUCH_MOMENTUM_MAX_DURATION, 180 + distance * 0.75)
    );
    // Give the browser one frame to paint the exact release position before
    // transitioning to the momentum target. Without this separation, both
    // writes can be batched into another visible jump.
    cancelMomentumFrame();
    momentumFrame.current = requestAnimationFrame(() => {
      momentumFrame.current = null;
      applyTranslate(target, true, duration, TOUCH_MOMENTUM_EASING);
    });
  }

  function handlePointerDown(e) {
    // If the previous mobile swipe did not produce a click, do not let its
    // suppression state consume this new, genuine tap.
    clearClickSuppression();

    if (
      !hasOverflow ||
      pointerId.current !== null ||
      (e.pointerType === "mouse" && e.button !== 0)
    ) {
      return;
    }

    cancelQueuedMove();
    cancelMomentumFrame();
    const currentX = renderedTranslateX(trackRef.current);
    applyTranslate(currentX);
    pointerId.current = e.pointerId;
    dragStartX.current = e.clientX;
    dragStartT.current = currentX;
    dragThreshold.current = e.pointerType === "touch"
      ? TOUCH_DRAG_THRESHOLD
      : MOUSE_DRAG_THRESHOLD;
    activePointerType.current = e.pointerType;
    wasDragged.current = false;
    lastMoveX.current = e.clientX;
    lastMoveAt.current = e.timeStamp;
    touchVelocity.current = 0;
  }

  function handlePointerMove(e) {
    if (pointerId.current !== e.pointerId) return;

    const now = e.timeStamp;
    const elapsed = now - lastMoveAt.current;
    if (elapsed > 0) {
      const instantaneousVelocity = (e.clientX - lastMoveX.current) / elapsed;
      touchVelocity.current = touchVelocity.current * 0.4 + instantaneousVelocity * 0.6;
      lastMoveX.current = e.clientX;
      lastMoveAt.current = now;
    }

    const delta = e.clientX - dragStartX.current;
    if (!wasDragged.current) {
      if (Math.abs(delta) < dragThreshold.current) return;

      const currentX = renderedTranslateX(trackRef.current);
      wasDragged.current = true;
      setDragging(true);
      // Touch/stylus already has implicit capture on the thumbnail button, and
      // its pointer events bubble to this track. Only mouse needs explicit
      // capture to keep dragging after the pointer leaves the strip.
      if (e.pointerType === "mouse") {
        e.currentTarget.setPointerCapture(e.pointerId);
      }

      // If the peek animation is still moving, begin the drag from the
      // position currently visible on screen rather than its destination.
      dragStartT.current = currentX - delta;
      applyTranslate(currentX);
    }

    queueTranslate(Math.max(minT, Math.min(maxT, dragStartT.current + delta)));
  }

  function finishPointer(e, cancelled = false) {
    if (pointerId.current !== e.pointerId) return;

    const didDrag = wasDragged.current;
    const pointerType = activePointerType.current;
    cancelQueuedMove();
    pointerId.current = null;
    activePointerType.current = null;
    wasDragged.current = false;
    setDragging(false);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (cancelled && didDrag) {
      if (pointerType === "mouse") {
        snapToClosestSlot();
      }
      return;
    }

    // Leave clean clicks alone so the thumbnail button can update the focused
    // image. Pointer capture is only used after a real drag begins.
    if (!didDrag) return;

    const finalT = Math.max(
      minT,
      Math.min(maxT, dragStartT.current + e.clientX - dragStartX.current)
    );
    // Render the actual release position before applying any continuation.
    // This matters most for a short, fast swipe whose last move was still
    // waiting for requestAnimationFrame when pointerup arrived.
    applyTranslate(finalT);
    suppressDragClick();

    if (pointerType === "mouse") {
      snapToClosestSlot();
    } else {
      coastTouchStrip(finalT, e.timeStamp);
    }
  }

  function handleLostPointerCapture(e) {
    // Ignore bubbled lostpointercapture events from thumbnail buttons.
    if (e.target !== e.currentTarget || pointerId.current !== e.pointerId) return;
    cancelQueuedMove();
    pointerId.current = null;
    activePointerType.current = null;
    wasDragged.current = false;
    setDragging(false);
    snapToClosestSlot();
  }

  function handleThumbClick(i) {
    if (suppressClick.current) {
      clearClickSuppression();
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
        className="overflow-hidden rounded-lg flex-1"
        style={{ maxWidth: measuredWidth ? `${measuredWidth}px` : undefined }}
      >
        <div
          ref={trackRef}
          className={`flex gap-2 ${
            hasOverflow ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
          }`}
          style={{
            touchAction: "pan-y pinch-zoom",
            willChange: "transform",
            WebkitUserDrag: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={(e) => finishPointer(e, true)}
          onLostPointerCapture={handleLostPointerCapture}
          onDragStart={(e) => e.preventDefault()}
        >
          {images.map((img, i) => renderThumb(img, i))}
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
