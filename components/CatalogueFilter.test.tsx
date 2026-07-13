import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CatalogueFilter } from './CatalogueFilter';
import type { CatalogueWork } from '@/lib/content';

const WORKS: CatalogueWork[] = [
  { slug: 'a', title: 'Work A', artist: 'Zdanevich', date: '1919', medium: 'Lithograph', image: '/catalogue/a.jpg', tags: ['Futurism'], caption: 'Caption A', sourceCitation: 'src A' },
  { slug: 'b', title: 'Work B', artist: 'Larionov', date: '1913', medium: 'Oil on canvas', image: '/catalogue/b.jpg', tags: ['Rayonism'], caption: 'Caption B', sourceCitation: 'src B' },
];

describe('CatalogueFilter', () => {
  it('filters works by artist', () => {
    let filtered: CatalogueWork[] = WORKS;
    render(<CatalogueFilter works={WORKS} onFilteredChange={(w) => (filtered = w)} />);
    fireEvent.change(screen.getByLabelText('Filter by artist'), { target: { value: 'Larionov' } });
    expect(filtered).toEqual([WORKS[1]]);
  });
});
