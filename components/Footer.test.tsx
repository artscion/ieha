import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders French text for the fr locale', () => {
    render(<Footer locale="fr" />);
    expect(screen.getByText(/Institut Européen du Patrimoine de l'Avant-Garde/)).toBeInTheDocument();
  });

  it('renders distinct text per locale', () => {
    const { unmount } = render(<Footer locale="ru" />);
    expect(screen.getByText(/Европейский Институт Наследия Авангарда/)).toBeInTheDocument();
    unmount();

    render(<Footer locale="de" />);
    expect(screen.getByText(/Europäisches Institut für das Erbe der Avantgarde/)).toBeInTheDocument();
  });
});
