import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QuestionCard } from '../QuestionCard';
import type { Question } from '../../types';

const mockQuestion: Question = {
  id: 1,
  title: 'Energy Level',
  optionA: { label: 'I want a playful, energetic cat.', tag: 'active' },
  optionB: { label: 'I want a calm, relaxed cat.', tag: 'mellow' },
};

describe('QuestionCard', () => {
  it('renders the question title and both options', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        selectedTag={null}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Energy Level')).toBeInTheDocument();
    expect(screen.getByText('I want a playful, energetic cat.')).toBeInTheDocument();
    expect(screen.getByText('I want a calm, relaxed cat.')).toBeInTheDocument();
  });

  it('highlights the selected option A', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        selectedTag="active"
        onSelect={vi.fn()}
      />
    );

    const optionA = screen.getByText('I want a playful, energetic cat.').closest('button');
    const optionB = screen.getByText('I want a calm, relaxed cat.').closest('button');

    expect(optionA).toHaveAttribute('aria-pressed', 'true');
    expect(optionB).toHaveAttribute('aria-pressed', 'false');
  });

  it('highlights the selected option B', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        selectedTag="mellow"
        onSelect={vi.fn()}
      />
    );

    const optionA = screen.getByText('I want a playful, energetic cat.').closest('button');
    const optionB = screen.getByText('I want a calm, relaxed cat.').closest('button');

    expect(optionA).toHaveAttribute('aria-pressed', 'false');
    expect(optionB).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onSelect with the correct tag when option A is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <QuestionCard
        question={mockQuestion}
        selectedTag={null}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByText('I want a playful, energetic cat.'));
    expect(onSelect).toHaveBeenCalledWith('active');
  });

  it('calls onSelect with the correct tag when option B is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <QuestionCard
        question={mockQuestion}
        selectedTag={null}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByText('I want a calm, relaxed cat.'));
    expect(onSelect).toHaveBeenCalledWith('mellow');
  });

  it('shows no option as selected when selectedTag is null', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        selectedTag={null}
        onSelect={vi.fn()}
      />
    );

    const optionA = screen.getByText('I want a playful, energetic cat.').closest('button');
    const optionB = screen.getByText('I want a calm, relaxed cat.').closest('button');

    expect(optionA).toHaveAttribute('aria-pressed', 'false');
    expect(optionB).toHaveAttribute('aria-pressed', 'false');
  });
});
