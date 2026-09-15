import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionnaireForm } from '../QuestionnaireForm';

vi.mock('../../api', () => ({
  submitAnswers: vi.fn(),
}));

describe('QuestionnaireForm', () => {
  const mockOnResults = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the first question initially', () => {
    render(
      <QuestionnaireForm onResults={mockOnResults} onError={mockOnError} />
    );

    expect(screen.getByText('Energy Level')).toBeInTheDocument();
    expect(screen.getByText('I want a playful, energetic cat.')).toBeInTheDocument();
    expect(screen.getByText('I want a calm, relaxed cat.')).toBeInTheDocument();
  });

  it('shows the progress bar starting at question 1 of 8', () => {
    render(
      <QuestionnaireForm onResults={mockOnResults} onError={mockOnError} />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/of 8/)).toBeInTheDocument();
  });

  it('disables the Back button on the first question', () => {
    render(
      <QuestionnaireForm onResults={mockOnResults} onError={mockOnError} />
    );

    expect(screen.getByText('Back')).toBeDisabled();
  });

  it('disables the Next button when no option is selected', () => {
    render(
      <QuestionnaireForm onResults={mockOnResults} onError={mockOnError} />
    );

    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('enables the Next button after selecting an option', async () => {
    const user = userEvent.setup();
    render(
      <QuestionnaireForm onResults={mockOnResults} onError={mockOnError} />
    );

    await user.click(screen.getByText('I want a playful, energetic cat.'));
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('navigates forward to the next question', async () => {
    const user = userEvent.setup();
    render(
      <QuestionnaireForm onResults={mockOnResults} onError={mockOnError} />
    );

    await user.click(screen.getByText('I want a playful, energetic cat.'));
    await user.click(screen.getByText('Next'));

    expect(screen.getByText('Social Style')).toBeInTheDocument();
  });

  it('navigates backward to the previous question', async () => {
    const user = userEvent.setup();
    render(
      <QuestionnaireForm onResults={mockOnResults} onError={mockOnError} />
    );

    // Go to question 2
    await user.click(screen.getByText('I want a playful, energetic cat.'));
    await user.click(screen.getByText('Next'));
    expect(screen.getByText('Social Style')).toBeInTheDocument();

    // Go back
    await user.click(screen.getByText('Back'));
    expect(screen.getByText('Energy Level')).toBeInTheDocument();
  });

  it('remembers selected answer when navigating back', async () => {
    const user = userEvent.setup();
    render(
      <QuestionnaireForm onResults={mockOnResults} onError={mockOnError} />
    );

    // Select option and go forward
    await user.click(screen.getByText('I want a playful, energetic cat.'));
    await user.click(screen.getByText('Next'));

    // Go back
    await user.click(screen.getByText('Back'));

    // The option should still be selected
    const optionA = screen.getByText('I want a playful, energetic cat.').closest('button');
    expect(optionA).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows submit button on the last question', async () => {
    const user = userEvent.setup();
    render(
      <QuestionnaireForm onResults={mockOnResults} onError={mockOnError} />
    );

    // Navigate through all 8 questions
    const optionChoices = [
      'I want a playful, energetic cat.',
      'I want a cat that loves meeting people and being social.',
      'I want a cuddly lap cat who likes to be held.',
      'Toys and games all day — I want a cat who plays.',
      "I'd like a young cat / kitten (under ~2 years).",
      "I don't mind regular brushing and grooming.",
      "I don't mind a vocal cat (talkative/meows).",
    ];

    for (const choice of optionChoices) {
      await user.click(screen.getByText(choice));
      await user.click(screen.getByText('Next'));
    }

    // On last question, should show submit button instead of Next
    expect(screen.getByText('Household Fit')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('calls submitAnswers on submit and passes results', async () => {
    const { submitAnswers } = await import('../../api');
    const mockedSubmit = vi.mocked(submitAnswers);
    const mockMatches = [
      {
        id: 1,
        name: 'Whiskers',
        description: 'A friendly cat',
        keywords: ['active', 'social'],
        adoptionUrl: 'https://example.com/whiskers',
        imageUrl: null,
        matchScore: 5,
      },
    ];
    mockedSubmit.mockResolvedValue(mockMatches);

    const user = userEvent.setup();
    render(
      <QuestionnaireForm onResults={mockOnResults} onError={mockOnError} />
    );

    // Answer all 8 questions
    const optionChoices = [
      'I want a playful, energetic cat.',
      'I want a cat that loves meeting people and being social.',
      'I want a cuddly lap cat who likes to be held.',
      'Toys and games all day — I want a cat who plays.',
      "I'd like a young cat / kitten (under ~2 years).",
      "I don't mind regular brushing and grooming.",
      "I don't mind a vocal cat (talkative/meows).",
    ];

    for (const choice of optionChoices) {
      await user.click(screen.getByText(choice));
      await user.click(screen.getByText('Next'));
    }

    // Select last answer and submit
    await user.click(
      screen.getByText('My home has kids or other pets — I want a social, tolerant cat.')
    );

    const submitBtn = screen.getByRole('button', { name: /find my match/i });
    await user.click(submitBtn);

    expect(mockedSubmit).toHaveBeenCalledWith([
      'active',
      'social',
      'affectionate',
      'playful',
      'young',
      'high_groom',
      'vocal',
      'good_with_kids_pets',
    ]);
  });
});
