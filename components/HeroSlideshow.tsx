'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CROSSFADE_DURATION_MS,
  MOTION_DURATION_MS,
  SLIDE_DURATION_MS,
  formatHeroCaption,
  type HeroSlide,
} from '@/lib/hero-slides';

type IncomingLayer = {
  slide: HeroSlide;
  index: number;
  loaded: boolean;
};

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [incoming, setIncoming] = useState<IncomingLayer | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advancingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState === 'visible');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Hold on the active slide, then queue the next image (do not fade until loaded).
  useEffect(() => {
    clearTimers();
    advancingRef.current = false;
    setIncoming(null);

    if (slides.length <= 1 || reducedMotion || !pageVisible) {
      return;
    }

    holdTimerRef.current = setTimeout(() => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      const nextIndex = (activeIndex + 1) % slides.length;
      setIncoming({
        slide: slides[nextIndex],
        index: nextIndex,
        loaded: false,
      });
    }, SLIDE_DURATION_MS);

    return clearTimers;
  }, [activeIndex, slides, reducedMotion, pageVisible, clearTimers]);

  // Once the incoming image has loaded, crossfade it over the active base layer.
  useEffect(() => {
    if (!incoming?.loaded) return;

    fadeTimerRef.current = setTimeout(() => {
      setActiveIndex(incoming.index);
      setIncoming(null);
      advancingRef.current = false;
    }, CROSSFADE_DURATION_MS);

    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, [incoming?.loaded, incoming?.index]);

  if (slides.length === 0) {
    return (
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#2a322c] via-[#1c211e] to-[#121512]"
        aria-hidden="true"
        data-testid="hero-slideshow-fallback"
      />
    );
  }

  const active = slides[activeIndex];
  const caption = formatHeroCaption(active);
  const showMotion = !reducedMotion && slides.length > 1;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true" data-testid="hero-slideshow">
      <SlideLayer
        slide={active}
        index={activeIndex}
        opacity={1}
        zIndex={1}
        priority
        animate={showMotion}
      />

      {incoming ? (
        <SlideLayer
          slide={incoming.slide}
          index={incoming.index}
          opacity={incoming.loaded ? 1 : 0}
          zIndex={2}
          animate={showMotion && incoming.loaded}
          onLoad={() => {
            setIncoming((current) =>
              current && current.index === incoming.index ? { ...current, loaded: true } : current
            );
          }}
        />
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.42))',
        }}
      />

      {caption ? (
        <p
          className="pointer-events-none absolute bottom-5 left-6 right-6 z-[5] font-sans text-[11px] uppercase tracking-[0.14em] text-cream/70 sm:bottom-8 sm:left-10"
          aria-live="off"
          data-testid="hero-slideshow-caption"
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}

function SlideLayer({
  slide,
  index,
  opacity,
  zIndex,
  priority = false,
  animate,
  onLoad,
}: {
  slide: HeroSlide;
  index: number;
  opacity: number;
  zIndex: number;
  priority?: boolean;
  animate: boolean;
  onLoad?: () => void;
}) {
  const direction = index % 2 === 0 ? 'a' : 'b';
  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex,
        opacity,
        transition: `opacity ${CROSSFADE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
      data-testid={`hero-slide-layer-${index}`}
      data-opacity={opacity}
    >
      <div
        className="absolute inset-0"
        style={
          animate
            ? {
                animation: `hero-kenburns-${direction} ${MOTION_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              }
            : undefined
        }
      >
        <Image
          src={slide.imageSrc}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover object-center"
          onLoad={onLoad}
        />
      </div>
    </div>
  );
}
