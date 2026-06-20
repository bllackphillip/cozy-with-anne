"use client";

import { useState, useRef, useEffect } from "react";

const MOUSE_DRAG_THRESHOLD = 5;
const TOUCH_DRAG_THRESHOLD = 10;
const CONTROL_MOVE_DURATION = 420;
const CONTROL_MOVE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const DRAG_CLICK_FALLBACK_WINDOW = 100;
const DRAG_CLICK_SUPPRESSION_TIMEOUT = 700;

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
  const dragThreshold = useRef(MOUSE_DRAG_THRESHOLD);
  const suppressedClick = useRef(null);
  const suppressClickTimer = useRef(null);
  const skipNextPositionEffect = useRef(false);
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
    if (suppressClickTimer.current !== null) {
      clearTimeout(suppressClickTimer.current);
    }
  }, []);

  function cancelQueuedMove() {
    if (moveFrame.current !== null) cancelAnimationFrame(moveFrame.current);
    moveFrame.current = null;
    pendingX.current = null;
  }

  function applyTransform(x, animate) {
    if (!trackRef.current) return;
    trackRef.current.style.transition = animate
      ? `transform ${CONTROL_MOVE_DURATION}ms ${CONTROL_MOVE_EASING}`
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
    if (skipNextPositionEffect.current) {
      skipNextPositionEffect.current = false;
      return;
    }
    const { tx } = computeLayout(containerW, active, slideWidthRatio, slideGapRatio, mobileWidthRatio);
    const animate = !firstLayout.current;
    firstLayout.current = false;
    applyTransform(tx, animate);
  }, [active, containerW, slideWidthRatio, slideGapRatio, mobileWidthRatio]);

  if (total === 0) return null;

  const { slideW, gap } = computeLayout(containerW, active, slideWidthRatio, slideGapRatio, mobileWidthRatio);

  function prev() { moveTo(activeRef.current - 1); }
  function next() { moveTo(activeRef.current + 1); }

  function getTrackBounds() {
    const { tx: maxX } = computeLayout(
      containerWRef.current,
      0,
      slideWidthRatio,
      slideGapRatio,
      mobileWidthRatio
    );
    const { tx: minX } = computeLayout(
      containerWRef.current,
      total - 1,
      slideWidthRatio,
      slideGapRatio,
      mobileWidthRatio
    );
    return { minX, maxX };
  }

  function clampTrackX(x) {
    const { minX, maxX } = getTrackBounds();
    return Math.max(minX, Math.min(maxX, x));
  }

  function resistTrackX(x) {
    const { minX, maxX } = getTrackBounds();
    if (x > maxX) return maxX + (x - maxX) * 0.22;
    if (x < minX) return minX + (x - minX) * 0.22;
    return x;
  }

  function syncActiveToTrack(x) {
    const { slideW, gap, tx: firstX } = computeLayout(
      containerWRef.current,
      0,
      slideWidthRatio,
      slideGapRatio,
      mobileWidthRatio
    );
    const unit = slideW + gap;
    const nearest = unit > 0 ? clampIndex(Math.round((firstX - x) / unit), total) : 0;
    if (nearest === activeRef.current) return;

    activeRef.current = nearest;
    skipNextPositionEffect.current = true;
    setActive(nearest);
  }

  function clearClickSuppression() {
    suppressedClick.current = null;
    if (suppressClickTimer.current !== null) {
      clearTimeout(suppressClickTimer.current);
      suppressClickTimer.current = null;
    }
  }

  function suppressDragClick(e) {
    suppressedClick.current = {
      pointerId: e.pointerId,
      releasedAt: e.timeStamp,
    };
    if (suppressClickTimer.current !== null) {
      clearTimeout(suppressClickTimer.current);
    }
    suppressClickTimer.current = window.setTimeout(() => {
      suppressedClick.current = null;
      suppressClickTimer.current = null;
    }, DRAG_CLICK_SUPPRESSION_TIMEOUT);
  }

  function shouldSuppressClick(e) {
    const suppression = suppressedClick.current;
    if (!suppression) return false;

    const clickPointerId = e.nativeEvent?.pointerId;
    const hasPointerId = Number.isFinite(clickPointerId) && clickPointerId > 0;
    const matchesDrag = hasPointerId
      ? clickPointerId === suppression.pointerId
      : e.timeStamp - suppression.releasedAt <= DRAG_CLICK_FALLBACK_WINDOW;

    if (matchesDrag) clearClickSuppression();
    return matchesDrag;
  }

  function handlePointerDown(e) {
    clearClickSuppression();
    if (pointerId.current !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (!trackRef.current) return;

    cancelQueuedMove();
    const currentX = renderedTranslateX(trackRef.current);
    applyTransform(currentX, false);
    pointerId.current = e.pointerId;
    dragStartX.current = e.clientX;
    dragThreshold.current = e.pointerType === "touch"
      ? TOUCH_DRAG_THRESHOLD
      : MOUSE_DRAG_THRESHOLD;
    wasDragged.current = false;
  }

  function handlePointerMove(e) {
    if (pointerId.current !== e.pointerId) return;

    let delta = e.clientX - dragStartX.current;
    if (!wasDragged.current) {
      if (Math.abs(delta) < dragThreshold.current) return;

      const currentX = renderedTranslateX(trackRef.current);
      wasDragged.current = true;
      setDragging(true);
      // Touch/stylus inputs already receive implicit capture on the pressed
      // child. Keep that capture so the eventual click target remains correct;
      // the pointer events still bubble through the carousel track. Mouse
      // needs explicit capture so dragging continues outside the track.
      if (e.pointerType === "mouse") {
        e.currentTarget.setPointerCapture(e.pointerId);
      }

      // Start from the track's currently rendered position so grabbing it
      // during a snap animation does not cause a jump.
      dragOriginX.current = currentX - delta;
      applyTransform(currentX, false);
    }

    queueTransform(resistTrackX(dragOriginX.current + delta));
  }

  function finishPointer(e, cancelled = false) {
    if (pointerId.current !== e.pointerId) return;

    const didDrag = wasDragged.current;
    cancelQueuedMove();
    pointerId.current = null;
    wasDragged.current = false;
    setDragging(false);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (cancelled && didDrag) {
      const finalX = clampTrackX(renderedTranslateX(trackRef.current));
      applyTransform(finalX, false);
      syncActiveToTrack(finalX);
      return;
    }

    // A clean press was never captured, so the nested link/button receives
    // its normal click.
    if (!didDrag) return;

    const finalX = clampTrackX(dragOriginX.current + e.clientX - dragStartX.current);
    applyTransform(finalX, false);
    syncActiveToTrack(finalX);
    suppressDragClick(e);
  }

  function handleLostPointerCapture(e) {
    // lostpointercapture bubbles. Ignore an implicit capture being released
    // from a child link; only recover when this track itself loses capture.
    if (e.target !== e.currentTarget || pointerId.current !== e.pointerId) return;
    cancelQueuedMove();
    const finalX = clampTrackX(renderedTranslateX(trackRef.current));
    pointerId.current = null;
    wasDragged.current = false;
    setDragging(false);
    applyTransform(finalX, false);
    syncActiveToTrack(finalX);
  }

  function handleClickCapture(e) {
    if (!shouldSuppressClick(e)) return;
    e.preventDefault();
    e.stopPropagation();
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
          onClickCapture={handleClickCapture}
          onDragStart={(e) => e.preventDefault()}
        >
          {valid.map((slide, i) => (
            <div
              key={i}
              className="flex-shrink-0"
              style={{ width: containerW > 0 ? `${slideW}px` : `${slideWidthRatio * 100}%` }}  /* SSR fallback; ResizeObserver corrects on mount */
            >
              {renderSlide(slide, i === active)}
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
