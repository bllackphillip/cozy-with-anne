"use client";

import { useState, useRef, useEffect } from "react";

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
  const dragStartX   = useRef(null);
  const wasDragged   = useRef(false);
  const touchStartX  = useRef(null);

  // Always-fresh refs so window handlers never read stale closure values
  const activeRef     = useRef(active);
  const containerWRef = useRef(containerW);
  useEffect(() => { activeRef.current = active; });
  useEffect(() => { containerWRef.current = containerW; });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (containerW === 0 || !trackRef.current) return;
    const { tx } = computeLayout(containerW, active, slideWidthRatio, slideGapRatio, mobileWidthRatio);
    const animate = !firstLayout.current;
    firstLayout.current = false;
    trackRef.current.style.transition = animate
      ? "transform 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)"
      : "none";
    trackRef.current.style.transform = `translateX(${tx}px)`;
  }, [active, containerW, slideWidthRatio, slideGapRatio, mobileWidthRatio]);

  useEffect(() => {
    if (!dragging) return;

    function handleMouseMove(e) {
      const delta = e.clientX - dragStartX.current;
      if (Math.abs(delta) > 5) wasDragged.current = true;
      if (!trackRef.current) return;
      const { tx } = computeLayout(containerWRef.current, activeRef.current, slideWidthRatio, slideGapRatio, mobileWidthRatio);
      trackRef.current.style.transition = "none";
      trackRef.current.style.transform  = `translateX(${tx + delta}px)`;
    }

    function handleMouseUp(e) {
      setDragging(false);
      const { slideW, gap } = computeLayout(containerWRef.current, 0, slideWidthRatio, slideGapRatio, mobileWidthRatio);
      const unit = slideW + gap;
      const dragDelta = dragStartX.current - e.clientX;
      const target = unit > 0
        ? Math.max(0, Math.min(total - 1, Math.round(activeRef.current + dragDelta / unit)))
        : activeRef.current;
      setActive(target);
      if (trackRef.current) {
        const { tx } = computeLayout(containerWRef.current, target, slideWidthRatio, slideGapRatio, mobileWidthRatio);
        trackRef.current.style.transition = "transform 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)";
        trackRef.current.style.transform  = `translateX(${tx}px)`;
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup",   handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup",   handleMouseUp);
    };
  }, [dragging, total, slideWidthRatio, slideGapRatio, mobileWidthRatio]);

  if (total === 0) return null;

  const { slideW, gap } = computeLayout(containerW, active, slideWidthRatio, slideGapRatio, mobileWidthRatio);

  function prev() { setActive(a => Math.max(0, a - 1)); }
  function next() { setActive(a => Math.min(total - 1, a + 1)); }

  function handleMouseDown(e) {
    e.preventDefault();
    dragStartX.current = e.clientX;
    wasDragged.current = false;
    setDragging(true);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    wasDragged.current = false;
  }

  function handleTouchMove(e) {
    if (touchStartX.current === null || !trackRef.current) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 5) wasDragged.current = true;
    const { tx } = computeLayout(containerWRef.current, activeRef.current, slideWidthRatio, slideGapRatio, mobileWidthRatio);
    trackRef.current.style.transition = "none";
    trackRef.current.style.transform  = `translateX(${tx + delta}px)`;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const { slideW, gap } = computeLayout(containerWRef.current, 0, slideWidthRatio, slideGapRatio, mobileWidthRatio);
    const unit = slideW + gap;
    const dragDelta = touchStartX.current - e.changedTouches[0].clientX;
    const target = unit > 0
      ? Math.max(0, Math.min(total - 1, Math.round(activeRef.current + dragDelta / unit)))
      : activeRef.current;
    setActive(target);
    if (trackRef.current) {
      const { tx } = computeLayout(containerWRef.current, target, slideWidthRatio, slideGapRatio, mobileWidthRatio);
      trackRef.current.style.transition = "transform 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)";
      trackRef.current.style.transform  = `translateX(${tx}px)`;
    }
    touchStartX.current = null;
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <div ref={containerRef} className={`py-4 sm:py-8 ${innerClassName}`}>
        <div
          ref={trackRef}
          className={`flex select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ gap: `${gap}px`, willChange: "transform" }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
                onClick={() => setActive(i)}
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
