import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero', () => {
  it('italicizes "sine ira et studio" inside the subhead', () => {
    render(
      <Hero
        content={{
          eyebrow: 'Test Eyebrow',
          headline: 'Test Headline',
          subhead: 'We study the works — sine ira et studio, without anger.',
        }}
        slides={[]}
      />
    );
    const em = screen.getByText('sine ira et studio');
    expect(em.tagName).toBe('EM');
  });

  it('renders the headline above the slideshow fallback', () => {
    render(
      <Hero
        content={{ eyebrow: 'IEHA', headline: 'Objectivity', subhead: 'A study.' }}
        slides={[]}
      />
    );
    expect(screen.getByRole('heading', { name: 'Objectivity' })).toBeTruthy();
    expect(screen.getByTestId('hero-slideshow-fallback')).toBeTruthy();
  });
});
