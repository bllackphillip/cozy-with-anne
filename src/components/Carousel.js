"use client";

import { useState, useRef, useEffect } from "react";

const DRAG_THRESHOLD = 5;
const FLICK_VELOCITY = 0.35;
const SNAP_DURATION = 420;
const SNAP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M13 4L7 10l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function computeLayout(cW, idx, slideWidthRatio, slideGapRatio, mobileWidthRatio) {
  if (cW === 0) return { slideW: 0, gap: 0, tx: 0 };
  const isMob  = cW < 768;
  const slideW = isMob ? cW * mobileWidthRatio : cW * slideWidthRatio;
  // Apply gap on mobile too when slides don't fill full width
  const gap    = isMob ? (mobileWidthRatio < 1 ? cW * slideGapRatio : 0) : cW * slideGapRatio;
  const peek   = (cW - slideW) / 2;
  return { slideW, gap, tx: peek - idx * (slideW + gap) };
}

function clampIndex(index, total) {
  return Math.max(0, Math.min(total - 1, index));
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

export default function Carousel({
  slides,
  initialIndex    = 0,
  renderSlide,
  slideWidthRatio = 0.76,
  slideGapRatio   = 0.04,
  mobileWidthRatio = 1.0,
  className        = "",
  innerClassName   = "",
}) {
  const valid = (slides || []).filter(Boolean);
  const total = valid.length;

  const [active, setActive]         = useState(() => Math.min(initialIndex, Math.max(0, total - 1)));
  const [containerW, setContainerW] = useState(0);
  const [dragging, setDragging]     = useState(false);

  const containerRef = useRef(null);
  const trackRef     = useRef(null);
  const firstLayout  = useRef(true);
  const wasDragged   = useRef(false);
  const pointerId    = useRef(null);
  const dragStartX   = useRef(0);
  const dragOriginX  = useRef(0);
  const dragStartAt  = useRef(0);
  const pendingX     = useRef(null);
  const moveFrame    = useRef(null);

  // Always-fresh refs so pointer handlers never read stale closure values.
  const activeRef     = useRef(active);
  const containerWRef = useRef(containerW);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { containerWRef.current = containerW; }, [containerW]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => {
    if (moveFrame.current !== null) cancelAnimationFrame(moveFrame.current);
  }, []);

  function cancelQueuedMove() {
    if (moveFrame.current !== null) cancelAnimationFrame(moveFrame.current);
    moveFrame.current = null;
    pendingX.current = null;
  }

  function applyTransform(x, animate) {
    if (!trackRef.current) return;
    trackRef.current.style.transition = animate
      ? `transform ${SNAP_DURATION}ms ${SNAP_EASING}`
      : "none";
    trackRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
  }

  function queueTransform(x) {
    pendingX.current = x;
    if (moveFrame.current !== null) return;

    moveFrame.current = requestAnimationFrame(() => {
      moveFrame.current = null;
      if (pendingX.current !== null) applyTransform(pendingX.current, false);
      pendingX.current = null;
    });
  }

  function moveTo(index, animate = true) {
    const target = clampIndex(index, total);
    activeRef.current = target;
    setActive(target);

    const { tx } = computeLayout(
      containerWRef.current,
      target,
      slideWidthRatio,
      slideGapRatio,
      mobileWidthRatio
    );
    applyTransform(tx, animate);
  }

  useEffect(() => {
    if (containerW === 0 || !trackRef.current || pointerId.current !== null) return;
    const { tx } = computeLayout(containerW, active, slideWidthRatio, slideGapRatio, mobileWidthRatio);
    const animate = !firstLayout.current;
    firstLayout.current = false;
    applyTransform(tx, animate);
  }, [active, containerW, slideWidthRatio, slideGapRatio, mobileWidthRatio]);

  if (total === 0) return null;

  const { slideW, gap } = computeLayout(containerW, active, slideWidthRatio, slideGapRatio, mobileWidthRatio);

  function prev() { moveTo(activeRef.current - 1); }
  function next() { moveTo(activeRef.current + 1); }

  function handlePointerDown(e) {
    if (pointerId.current !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (!trackRef.current) return;

    cancelQueuedMove();
    const currentX = renderedTranslateX(trackRef.current);
    applyTransform(currentX, false);

    pointerId.current = e.pointerId;
    dragStartX.current = e.clientX;
    dragOriginX.current = currentX;
    dragStartAt.current = performance.now();
    wasDragged.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    if (e.pointerType === "mouse") e.preventDefault();
  }

  function handlePointerMove(e) {
    if (pointerId.current !== e.pointerId) return;

    let delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > DRAG_THRESHOLD) wasDragged.current = true;

    // A little resistance at either end makes the boundary feel physical
    // without allowing the carousel to drift far beyond its content.
    const pullingPastStart = activeRef.current === 0 && delta > 0;
    const pullingPastEnd = activeRef.current === total - 1 && delta < 0;
    if (pullingPastStart || pullingPastEnd) delta *= 0.22;

    queueTransform(dragOriginX.current + delta);
  }

  function finishPointer(e, cancelled = false) {
    if (pointerId.current !== e.pointerId) return;

    cancelQueuedMove();
    pointerId.current = null;
    setDragging(false);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (cancelled) {
      moveTo(activeRef.current);
      return;
    }

    const { slideW, gap } = computeLayout(containerWRef.current, 0, slideWidthRatio, slideGapRatio, mobileWidthRatio);
    const unit = slideW + gap;
    const dragDistance = dragStartX.current - e.clientX;
    const elapsed = Math.max(1, performance.now() - dragStartAt.current);
    const velocity = dragDistance / elapsed;
    let slideOffset = unit > 0 ? Math.round(dragDistance / unit) : 0;

    const snapDistance = Math.min(56, unit * 0.16);
    if (
      slideOffset === 0 &&
      (Math.abs(dragDistance) >= snapDistance || Math.abs(velocity) >= FLICK_VELOCITY)
    ) {
      slideOffset = Math.sign(dragDistance);
    }

    moveTo(activeRef.current + slideOffset);
  }

  function handleLostPointerCapture(e) {
    if (pointerId.current !== e.pointerId) return;
    cancelQueuedMove();
    pointerId.current = null;
    setDragging(false);
    moveTo(activeRef.current);
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <div ref={containerRef} className={`py-4 sm:py-8 ${innerClassName}`}>
        <div
          ref={trackRef}
          className={`flex select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            gap: `${gap}px`,
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
          {valid.map((slide, i) => (
            <div
              key={i}
              className="flex-shrink-0"
              style={{ width: containerW > 0 ? `${slideW}px` : `${slideWidthRatio * 100}%` }}  /* SSR fallback; ResizeObserver corrects on mount */
            >
              {renderSlide(slide, i === active, wasDragged)}
            </div>
          ))}
        </div>
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-3 pb-4 sm:pb-8">
          <button
            onClick={prev}
            aria-label="Previous"
            className={`w-7 h-7 flex items-center justify-center site-btn transition-opacity duration-200 ${
              active === 0 ? "opacity-30 pointer-events-none" : "opacity-100"
            }`}
          >
            <ChevronLeft />
          </button>

          <div className="flex gap-2 items-center">
            {valid.map((_, i) => (
              <button
                key={i}
                onClick={() => moveTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === active ? "bg-[var(--color-accent)] scale-125" : "bg-[var(--color-surface)] hover:bg-[var(--color-border-warm)]"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Next"
            className={`w-7 h-7 flex items-center justify-center site-btn transition-opacity duration-200 ${
              active === total - 1 ? "opacity-30 pointer-events-none" : "opacity-100"
            }`}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
