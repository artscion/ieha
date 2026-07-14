import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, cleanup } from '@testing-library/react';
import { HeroSlideshow } from './HeroSlideshow';
import { CROSSFADE_DURATION_MS, SLIDE_DURATION_MS, type HeroSlide } from '@/lib/hero-slides';

vi.mock('next/image', () => ({
  default: function MockImage({
    onLoad,
    priority,
    ...props
  }: {
    onLoad?: () => void;
    priority?: boolean;
    src: string;
    alt: string;
  }) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={props.src}
        alt={props.alt}
        data-priority={priority ? 'true' : 'false'}
        onLoad={onLoad}
      />
    );
  },
}));

const slides: HeroSlide[] = [
  {
    id: 'a',
    imageSrc: '/catalogue/a.jpg',
    alt: 'A by Artist',
    title: 'A',
    artist: 'Artist',
    year: '1919',
  },
  {
    id: 'b',
    imageSrc: '/catalogue/b.jpg',
    alt: 'B by Artist',
    title: 'B',
    artist: 'Artist',
    year: '1920',
  },
];

describe('HeroSlideshow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? false : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders the first slide immediately', () => {
    render(<HeroSlideshow slides={slides} />);
    const images = screen.getAllByRole('presentation', { hidden: true }).length
      ? screen.getAllByRole('presentation', { hidden: true })
      : document.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
    expect((images[0] as HTMLImageElement).src).toContain('/catalogue/a.jpg');
    expect((images[0] as HTMLImageElement).getAttribute('data-priority')).toBe('true');
    expect(screen.getByTestId('hero-slideshow-caption').textContent).toContain('Artist — A, 1919');
  });

  it('crossfades only after the incoming image has loaded', () => {
    render(<HeroSlideshow slides={slides} />);

    act(() => {
      vi.advanceTimersByTime(SLIDE_DURATION_MS);
    });

    // Incoming layer mounts at opacity 0 before load.
    const incoming = screen.getByTestId('hero-slide-layer-1');
    expect(incoming.getAttribute('data-opacity')).toBe('0');

    const incomingImg = incoming.querySelector('img');
    expect(incomingImg).toBeTruthy();

    act(() => {
      incomingImg?.dispatchEvent(new Event('load'));
    });
    expect(incoming.getAttribute('data-opacity')).toBe('1');

    act(() => {
      vi.advanceTimersByTime(CROSSFADE_DURATION_MS);
    });

    expect(screen.getByTestId('hero-slideshow-caption').textContent).toContain('Artist — B, 1920');
  });

  it('keeps a single image static without advancing', () => {
    render(<HeroSlideshow slides={[slides[0]]} />);
    act(() => {
      vi.advanceTimersByTime(SLIDE_DURATION_MS * 3);
    });
    expect(screen.queryByTestId('hero-slide-layer-1')).toBeNull();
    expect(screen.getByTestId('hero-slideshow-caption').textContent).toContain('Artist — A');
  });

  it('renders a no-image fallback', () => {
    render(<HeroSlideshow slides={[]} />);
    expect(screen.getByTestId('hero-slideshow-fallback')).toBeTruthy();
  });

  it('pauses rotation while the document is hidden', () => {
    let visibility: DocumentVisibilityState = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });

    render(<HeroSlideshow slides={slides} />);

    visibility = 'hidden';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    act(() => {
      vi.advanceTimersByTime(SLIDE_DURATION_MS * 2);
    });
    expect(screen.queryByTestId('hero-slide-layer-1')).toBeNull();
  });

  it('disables transform animation under reduced motion', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<HeroSlideshow slides={slides} />);
    act(() => {
      vi.advanceTimersByTime(SLIDE_DURATION_MS * 2);
    });
    expect(screen.queryByTestId('hero-slide-layer-1')).toBeNull();
    const layer = screen.getByTestId('hero-slide-layer-0');
    expect(layer.innerHTML.includes('hero-kenburns')).toBe(false);
  });

  it('cleans up timers on unmount', () => {
    const clearSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = render(<HeroSlideshow slides={slides} />);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
