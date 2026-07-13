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
      />
    );
    const em = screen.getByText('sine ira et studio');
    expect(em.tagName).toBe('EM');
  });
});
