import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProsePage } from './ProsePage';

describe('ProsePage', () => {
  it('renders title, lead, and every section heading', () => {
    render(
      <ProsePage
        content={{
          title: 'Test Title',
          lead: 'Test lead paragraph.',
          sections: [
            { heading: 'Section One', body: 'Body one.' },
            { heading: 'Section Two', body: 'Body two.' },
          ],
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Test Title' })).toBeInTheDocument();
    expect(screen.getByText('Test lead paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Section One')).toBeInTheDocument();
    expect(screen.getByText('Section Two')).toBeInTheDocument();
  });
});
