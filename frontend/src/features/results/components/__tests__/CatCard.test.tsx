import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CatCard } from '../CatCard';
import type { CatMatch } from '../../types';

const mockCat: CatMatch = {
  id: 1,
  name: 'Whiskers',
  description:
    'Whiskers is an energetic and playful kitten who loves toys and meeting new people. She is very social and loves to cuddle on the couch after a long play session.',
  keywords: ['active', 'social', 'playful', 'young', 'vocal'],
  adoptionUrl: 'https://www.bkcatcafe.com/cats/whiskers',
  imageUrl: 'https://www.bkcatcafe.com/images/whiskers.jpg',
  matchScore: 5,
};

const mockCatNoImage: CatMatch = {
  ...mockCat,
  id: 2,
  name: 'Shadow',
  imageUrl: null,
};

describe('CatCard', () => {
  it('renders cat name', () => {
    render(<CatCard cat={mockCat} />);
    expect(screen.getByText('Whiskers')).toBeInTheDocument();
  });

  it('renders truncated description', () => {
    render(<CatCard cat={mockCat} />);
    // The full description is 165 chars, so it should be truncated
    const desc = screen.getByText(/Whiskers is an energetic/);
    expect(desc).toBeInTheDocument();
    expect(desc.textContent).toContain('...');
  });

  it('renders match score badge', () => {
    render(<CatCard cat={mockCat} />);
    expect(screen.getByText('5/8 match')).toBeInTheDocument();
  });

  it('renders the adoption link with correct URL', () => {
    render(<CatCard cat={mockCat} />);
    const link = screen.getByRole('link', { name: /meet whiskers/i });
    expect(link).toHaveAttribute('href', 'https://www.bkcatcafe.com/cats/whiskers');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the cat image when imageUrl is provided', () => {
    render(<CatCard cat={mockCat} />);
    const img = screen.getByAltText('Whiskers');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://www.bkcatcafe.com/images/whiskers.jpg');
  });

  it('renders a placeholder when imageUrl is null', () => {
    render(<CatCard cat={mockCatNoImage} />);
    // Should not have an img element with the cat name alt text
    expect(screen.queryByAltText('Shadow')).not.toBeInTheDocument();
    // Should still render the card successfully
    expect(screen.getByText('Shadow')).toBeInTheDocument();
  });

  it('shows short description without truncation when under limit', () => {
    const shortDescCat: CatMatch = {
      ...mockCat,
      id: 3,
      description: 'A sweet and gentle cat.',
    };
    render(<CatCard cat={shortDescCat} />);
    expect(screen.getByText('A sweet and gentle cat.')).toBeInTheDocument();
  });
});
