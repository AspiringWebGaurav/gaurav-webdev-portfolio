"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    quote: string;
    name: string;
    title: string;
    avatar?: string;
    isAnonymous?: boolean;
    socialUrl?: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Position & physics animation refs
  const currentXRef = useRef<number>(0);
  const setWidthRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isHoveredRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartYRef = useRef<number>(0);
  const dragStartPosRef = useRef<number>(0);
  const isHorizontalScrollRef = useRef<boolean | null>(null);
  const lastPointerTimeRef = useRef<number>(0);
  const lastPointerXRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const inertiaVelocityRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const [isReady, setIsReady] = useState(false);
  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false);

  // Triplicate items for seamless wrapping during left/right swipes
  const triplicatedItems = useMemo(
    () => [...items, ...items, ...items],
    [items]
  );

  // Base auto-scroll speed in pixels per second
  const baseSpeedPxPerSec = useMemo(() => {
    const dirFactor = direction === "right" ? 1 : -1;
    let base = 28; // slow default
    if (speed === "fast") base = 65;
    else if (speed === "normal") base = 42;
    return base * dirFactor;
  }, [direction, speed]);

  // Measure the width of one full set of items with subpixel accuracy
  const measureSetWidth = useCallback(() => {
    if (!listRef.current || items.length === 0) return;
    const children = listRef.current.children;
    if (children.length >= items.length * 2) {
      const item0 = children[0] as HTMLElement;
      const itemN = children[items.length] as HTMLElement;
      if (item0 && itemN) {
        const width = itemN.offsetLeft - item0.offsetLeft;
        if (width > 0) {
          setWidthRef.current = width;
          // Center at set 2 (middle) initially if unset
          if (currentXRef.current === 0) {
            currentXRef.current = -width;
            if (listRef.current) {
              listRef.current.style.transform = `translate3d(${-width}px, 0, 0)`;
            }
          }
          setIsReady(true);
        }
      }
    }
  }, [items.length]);

  useEffect(() => {
    measureSetWidth();
    window.addEventListener("resize", measureSetWidth);
    return () => window.removeEventListener("resize", measureSetWidth);
  }, [measureSetWidth]);

  // Main 60/120fps Animation Loop: auto-scroll + iOS-like inertia decay
  useEffect(() => {
    if (!isReady) return;

    let isMounted = true;
    lastFrameTimeRef.current = performance.now();

    const loop = (time: number) => {
      if (!isMounted) return;

      const dt = Math.min((time - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = time;

      const setWidth = setWidthRef.current;
      if (setWidth > 0 && listRef.current) {
        let x = currentXRef.current;

        if (isDraggingRef.current) {
          // Handled directly in pointer move for 1:1 tracking
        } else if (Math.abs(inertiaVelocityRef.current) > 2) {
          // iPhone-like inertia gliding with smooth friction decay
          x += inertiaVelocityRef.current * dt;
          const friction = Math.pow(0.92, dt * 60);
          inertiaVelocityRef.current *= friction;

          // Seamless transition back to marquee speed when inertia settles
          if (Math.abs(inertiaVelocityRef.current) < Math.abs(baseSpeedPxPerSec) * 0.5) {
            inertiaVelocityRef.current = 0;
          }
        } else {
          // Marquee auto-scroll (paused if hovered and pauseOnHover is enabled)
          const shouldPause = pauseOnHover && isHoveredRef.current;
          if (!shouldPause) {
            x += baseSpeedPxPerSec * dt;
          }
        }

        // Seamless wrap-around: middle set is between -setWidth and -2 * setWidth
        if (x < -2 * setWidth) {
          x += setWidth;
        } else if (x > -setWidth) {
          x -= setWidth;
        }

        currentXRef.current = x;
        listRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      isMounted = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isReady, baseSpeedPxPerSec, pauseOnHover]);

  // Pointer event handlers (unified mouse click-and-drag + touch swipe)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    isHorizontalScrollRef.current = null;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragStartPosRef.current = currentXRef.current;
    lastPointerXRef.current = e.clientX;
    lastPointerTimeRef.current = performance.now();
    velocityRef.current = 0;
    inertiaVelocityRef.current = 0;

    setIsCursorGrabbing(true);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartXRef.current;
    const dy = e.clientY - dragStartYRef.current;

    // Detect scroll intent on initial movement
    if (isHorizontalScrollRef.current === null) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 7) {
        // Vertical page scroll detected -> release capture so page scrolls smoothly
        isHorizontalScrollRef.current = false;
        isDraggingRef.current = false;
        setIsCursorGrabbing(false);
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
        return;
      }
      if (Math.abs(dx) > 6) {
        isHorizontalScrollRef.current = true;
        hasDraggedRef.current = true;
      }
    }

    if (isHorizontalScrollRef.current) {
      hasDraggedRef.current = true;
      const now = performance.now();
      const dt = Math.max((now - lastPointerTimeRef.current) / 1000, 0.001);
      const deltaX = e.clientX - lastPointerXRef.current;

      // Calculate instantaneous velocity
      const instantVelocity = deltaX / dt;
      velocityRef.current = 0.7 * instantVelocity + 0.3 * velocityRef.current;

      lastPointerXRef.current = e.clientX;
      lastPointerTimeRef.current = now;

      // 1:1 drag position update
      let newX = dragStartPosRef.current + dx;
      const setWidth = setWidthRef.current;
      if (setWidth > 0) {
        if (newX < -2 * setWidth) newX += setWidth;
        else if (newX > -setWidth) newX -= setWidth;
      }

      currentXRef.current = newX;
      if (listRef.current) {
        listRef.current.style.transform = `translate3d(${newX}px, 0, 0)`;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsCursorGrabbing(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // If swiped with velocity, launch iOS-like momentum glide
    if (hasDraggedRef.current && Math.abs(velocityRef.current) > 50) {
      inertiaVelocityRef.current = velocityRef.current;
    }

    // Reset hasDragged after microtask to prevent accidental link clicks during drag
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    setIsCursorGrabbing(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  // Suppress accidental link clicks during drag
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
      onClickCapture={handleClickCapture}
      className={cn(
        "scroller relative z-20 w-screen max-w-full overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)] touch-pan-y",
        isCursorGrabbing ? "cursor-grabbing" : "cursor-grab",
        className
      )}
    >
      <ul
        ref={listRef}
        className="flex min-w-full shrink-0 gap-16 py-4 w-max flex-nowrap will-change-transform"
        style={{
          transform: currentXRef.current ? `translate3d(${currentXRef.current}px, 0, 0)` : undefined,
        }}
      >
        {triplicatedItems.map((item, idx) => {
          const isDuplicate = idx >= items.length;
          return (
            <li
              aria-hidden={isDuplicate ? "true" : undefined}
              className="w-[90vw] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-800 p-5 md:p-16 md:w-[60vw] select-none"
              style={{
                background: "rgb(4,7,29)",
                backgroundColor:
                  "linear-gradient(90deg, rgba(4,7,29,1) 0%, rgba(12,14,35,1) 100%)",
              }}
              key={`card-${idx}-${item.name}`}
            >
              <blockquote>
                <div
                  aria-hidden="true"
                  className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
                />
                <span className="relative z-20 text-sm md:text-lg leading-[1.6] text-white font-normal">
                  {item.quote}
                </span>
                <div className="relative z-20 mt-6 flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div className="flex flex-row items-center min-w-0 max-w-full sm:max-w-[70%]">
                    <div className="me-3 shrink-0">
                      {item.isAnonymous ? (
                        <div className="w-[50px] h-[50px] rounded-full bg-[#10132E] border border-purple/40 flex items-center justify-center text-purple shadow-xs">
                          <svg
                            className="w-5 h-5 text-purple"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={item.avatar || "/profile.webp"}
                          alt={item.name}
                          className="w-[50px] h-[50px] rounded-full object-cover border border-white/[0.12] shadow-md pointer-events-none"
                        />
                      )}
                    </div>
                    <span className="flex flex-col gap-1 min-w-0">
                      <span className="text-xl font-bold leading-[1.4] text-white">
                        {item.name}
                      </span>
                      <span className="text-sm leading-[1.4] text-white-200 font-normal line-clamp-2">
                        {item.title}
                      </span>
                    </span>
                  </div>

                  {/* Recruiter Cross-Check Verification or NDA Privacy Badge */}
                  {item.socialUrl ? (
                    <a
                      href={item.socialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#10132E] hover:bg-[#161A31] text-[#CBACF9] border border-purple/30 hover:border-purple/60 transition-colors cursor-pointer group shadow-xs shrink-0"
                      title={`Cross-check ${item.name} profile on Facebook`}
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-[#1877F2]" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Cross-Check Profile</span>
                      <svg className="w-3 h-3 text-white/50 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#10132E]/90 text-[#C1C2D3] border border-white/[0.08] shadow-xs shrink-0"
                      title="Client identity & project details kept strictly confidential as per signed Non-Disclosure Agreement (NDA)"
                    >
                      <svg className="w-3.5 h-3.5 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Privacy Retained per NDA</span>
                    </div>
                  )}
                </div>
              </blockquote>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
