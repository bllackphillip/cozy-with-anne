"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";

const MOUSE_DRAG_THRESHOLD = 5;
const MOUSE_MOMENTUM_MIN_VELOCITY = 0.08;
const MOUSE_MOMENTUM_STOP_VELOCITY = 0.02;
const MOUSE_MOMENTUM_MAX_VELOCITY = 2.5;
const MOUSE_MOMENTUM_FRICTION = 0.95;
const SCROLL_SETTLE_DELAY = 120;

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

function computeLayout(
  containerW,
  slideWidthRatio,
  slideGapRatio,
  mobileWidthRatio,
  desktopLayoutMaxWidth
) {
  if (containerW === 0) return { slideW: 0, gap: 0, edgePadding: 0 };

  const isMobile = containerW < 768;
  const layoutW = isMobile || !desktopLayoutMaxWidth
    ? containerW
    : Math.min(containerW, desktopLayoutMaxWidth);
  const slideW = isMobile
    ? containerW * mobileWidthRatio
    : layoutW * slideWidthRatio;
  const gap = isMobile
    ? (mobileWidthRatio < 1 ? containerW * slideGapRatio : 0)
    : layoutW * slideGapRatio;

  return {
    slideW,
    gap,
    edgePadding: Math.max(0, (containerW - slideW) / 2),
  };
}

function clampIndex(index, total) {
  return Math.max(0, Math.min(total - 1, index));
}

export default function Carousel({
  slides,
  initialIndex = 0,
  renderSlide,
  slideWidthRatio = 0.76,
  slideGapRatio = 0.04,
  mobileWidthRatio = 1.0,
  desktopLayoutMaxWidth,
  desktopMouseMomentum = false,
  desktopStableControls = false,
  className = "",
  innerClassName = "",
}) {
  const valid = (slides || []).filter(Boolean);
  const total = valid.length;
  const initial = Math.min(initialIndex, Math.max(0, total - 1));

  const [active, setActive] = useState(initial);
  const [containerW, setContainerW] = useState(0);
  const [dragging, setDragging] = useState(false);

  const viewportRef = useRef(null);
  const slideRefs = useRef([]);
  const activeRef = useRef(initial);
  const scrollFrame = useRef(null);
  const scrollSettleTimer = useRef(null);
  const programmaticTarget = useRef(null);
  const momentumFrame = useRef(null);

  const mousePointerId = useRef(null);
  const mouseStartX = useRef(0);
  const mouseStartScrollLeft = useRef(0);
  const mouseLastX = useRef(0);
  const mouseLastTime = useRef(0);
  const mouseVelocity = useRef(0);
  const mouseDragged = useRef(false);
  const suppressMouseClick = useRef(false);
  const suppressMouseClickTimer = useRef(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    if (momentumFrame.current !== null) cancelAnimationFrame(momentumFrame.current);
    if (scrollSettleTimer.current !== null) clearTimeout(scrollSettleTimer.current);
    if (suppressMouseClickTimer.current !== null) {
      clearTimeout(suppressMouseClickTimer.current);
    }
  }, []);

  const { slideW, gap, edgePadding } = computeLayout(
    containerW,
    slideWidthRatio,
    slideGapRatio,
    mobileWidthRatio,
    desktopLayoutMaxWidth
  );

  function cancelMomentum() {
    if (momentumFrame.current !== null) {
      cancelAnimationFrame(momentumFrame.current);
      momentumFrame.current = null;
    }
  }

  function clearScrollSettleTimer() {
    if (scrollSettleTimer.current !== null) {
      clearTimeout(scrollSettleTimer.current);
      scrollSettleTimer.current = null;
    }
  }

  function scrollToIndex(index, behavior = "smooth") {
    const viewport = viewportRef.current;
    const slide = slideRefs.current[index];
    if (!viewport || !slide) return;

    const left = slide.offsetLeft - (viewport.clientWidth - slide.offsetWidth) / 2;
    viewport.scrollTo({ left, behavior });
  }

  function usesDesktopControlLock() {
    const viewport = viewportRef.current;
    return Boolean(
      desktopStableControls &&
      viewport &&
      viewport.clientWidth >= 768
    );
  }

  useLayoutEffect(() => {
    if (containerW === 0 || total === 0) return;

    const index = clampIndex(activeRef.current, total);
    scrollToIndex(index, "auto");
  }, [containerW, total, slideW, gap]);

  if (total === 0) return null;

  function updateActiveFromScroll() {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex !== activeRef.current) {
      activeRef.current = nearestIndex;
      setActive(nearestIndex);
    }
  }

  function handleScroll() {
    if (!usesDesktopControlLock()) {
      if (scrollFrame.current !== null) return;
      scrollFrame.current = requestAnimationFrame(() => {
        scrollFrame.current = null;
        updateActiveFromScroll();
      });
      return;
    }

    if (programmaticTarget.current === null && scrollFrame.current === null) {
      scrollFrame.current = requestAnimationFrame(() => {
        scrollFrame.current = null;
        updateActiveFromScroll();
      });
    }

    clearScrollSettleTimer();
    scrollSettleTimer.current = window.setTimeout(
      handleScrollEnd,
      SCROLL_SETTLE_DELAY
    );
  }

  function handleScrollEnd() {
    if (!usesDesktopControlLock() && momentumFrame.current === null) return;

    clearScrollSettleTimer();

    const target = programmaticTarget.current;
    programmaticTarget.current = null;

    if (target !== null) {
      activeRef.current = target;
      setActive(target);
      return;
    }

    updateActiveFromScroll();
  }

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
    if (e.pointerType !== "mouse" || e.button !== 0 || mousePointerId.current !== null) {
      return;
    }

    cancelMomentum();
    clearScrollSettleTimer();
    programmaticTarget.current = null;
    clearMouseClickSuppression();

    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollTo({ left: viewport.scrollLeft, behavior: "auto" });
    }

    mousePointerId.current = e.pointerId;
    mouseStartX.current = e.clientX;
    mouseStartScrollLeft.current = viewport?.scrollLeft ?? 0;
    mouseLastX.current = e.clientX;
    mouseLastTime.current = e.timeStamp;
    mouseVelocity.current = 0;
    mouseDragged.current = false;
  }

  function handlePointerMove(e) {
    if (e.pointerType !== "mouse" || mousePointerId.current !== e.pointerId) return;

    const delta = e.clientX - mouseStartX.current;
    const elapsed = e.timeStamp - mouseLastTime.current;
    const moved = e.clientX - mouseLastX.current;
    mouseLastX.current = e.clientX;
    mouseLastTime.current = e.timeStamp;

    if (!mouseDragged.current) {
      if (Math.abs(delta) < MOUSE_DRAG_THRESHOLD) return;
      mouseDragged.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    e.preventDefault();
    e.currentTarget.scrollLeft = mouseStartScrollLeft.current - delta;

    if (elapsed > 0) {
      const instantaneousVelocity = -moved / elapsed;
      mouseVelocity.current =
        mouseVelocity.current * 0.65 + instantaneousVelocity * 0.35;
    }
  }

  function startMouseMomentum(initialVelocity) {
    const viewport = viewportRef.current;
    if (
      !desktopMouseMomentum ||
      !viewport ||
      viewport.clientWidth < 768 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let velocity = Math.max(
      -MOUSE_MOMENTUM_MAX_VELOCITY,
      Math.min(MOUSE_MOMENTUM_MAX_VELOCITY, initialVelocity)
    );
    if (Math.abs(velocity) < MOUSE_MOMENTUM_MIN_VELOCITY) return;

    let previousTime = performance.now();

    function step(currentTime) {
      const elapsed = Math.min(32, currentTime - previousTime);
      previousTime = currentTime;

      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      const nextScrollLeft = Math.max(
        0,
        Math.min(maxScrollLeft, viewport.scrollLeft + velocity * elapsed)
      );
      const reachedBoundary =
        nextScrollLeft === 0 || nextScrollLeft === maxScrollLeft;

      viewport.scrollLeft = nextScrollLeft;
      velocity *= Math.pow(
        MOUSE_MOMENTUM_FRICTION,
        elapsed / (1000 / 60)
      );

      if (
        reachedBoundary ||
        Math.abs(velocity) < MOUSE_MOMENTUM_STOP_VELOCITY
      ) {
        momentumFrame.current = null;
        handleScrollEnd();
        return;
      }

      momentumFrame.current = requestAnimationFrame(step);
    }

    momentumFrame.current = requestAnimationFrame(step);
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

    if (didDrag) {
      suppressImmediateMouseClick();

      const timeSinceLastMove = e.timeStamp - mouseLastTime.current;
      const releaseVelocity = timeSinceLastMove < 80
        ? mouseVelocity.current
        : 0;
      startMouseMomentum(releaseVelocity);
    }
  }

  function handleClickCapture(e) {
    if (!suppressMouseClick.current) return;
    clearMouseClickSuppression();
    e.preventDefault();
    e.stopPropagation();
  }

  function moveTo(index) {
    const target = clampIndex(index, total);
    cancelMomentum();
    activeRef.current = target;
    setActive(target);

    if (!usesDesktopControlLock()) {
      scrollToIndex(target);
      return;
    }

    clearScrollSettleTimer();
    programmaticTarget.current = target;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    scrollToIndex(target, reducedMotion ? "auto" : "smooth");

    if (reducedMotion) {
      programmaticTarget.current = null;
    }
  }

  return (
    <div className={className}>
      <div className={innerClassName}>
        <div
          ref={viewportRef}
          className={`overflow-x-auto overflow-y-hidden py-4 sm:py-8 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x pan-y pinch-zoom",
          }}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishMousePointer}
          onPointerCancel={finishMousePointer}
          onScrollEnd={handleScrollEnd}
          onClickCapture={handleClickCapture}
          onDragStart={(e) => e.preventDefault()}
        >
          <div
            className="flex w-max"
            style={{
              gap: `${gap}px`,
              paddingInline: `${edgePadding}px`,
            }}
          >
            {valid.map((slide, index) => (
              <div
                key={index}
                ref={(element) => {
                  slideRefs.current[index] = element;
                }}
                className="flex-shrink-0"
                style={{
                  width: containerW > 0
                    ? `${slideW}px`
                    : `${slideWidthRatio * 100}vw`,
                }}
              >
                {renderSlide(slide, index === active)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-3 pb-4 sm:pb-8">
          <button
            onClick={() => moveTo(activeRef.current - 1)}
            aria-label="Previous"
            className={`w-7 h-7 flex items-center justify-center site-btn transition-opacity duration-200 ${
              active === 0 ? "opacity-30 pointer-events-none" : "opacity-100"
            }`}
          >
            <ChevronLeft />
          </button>

          <div className="flex gap-2 items-center">
            {valid.map((_, index) => (
              <button
                key={index}
                onClick={() => moveTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === active
                    ? "bg-[var(--color-accent)] scale-125"
                    : "bg-[var(--color-surface)] hover:bg-[var(--color-border-warm)]"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => moveTo(activeRef.current + 1)}
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
