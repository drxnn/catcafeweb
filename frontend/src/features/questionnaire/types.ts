export interface QuestionOption {
  label: string;
  tag: string;
}

export interface Question {
  id: number;
  title: string;
  optionA: QuestionOption;
  optionB: QuestionOption;
}

export const questions: Question[] = [
  {
    id: 1,
    title: 'Energy Level',
    optionA: { label: 'I want a playful, energetic cat.', tag: 'active' },
    optionB: { label: 'I want a calm, relaxed cat.', tag: 'mellow' },
  },
  {
    id: 2,
    title: 'Social Style',
    optionA: { label: 'I want a cat that loves meeting people and being social.', tag: 'social' },
    optionB: { label: "I prefer a cat that's a bit shy or low-key.", tag: 'shy' },
  },
  {
    id: 3,
    title: 'Affection',
    optionA: { label: 'I want a cuddly lap cat who likes to be held.', tag: 'affectionate' },
    optionB: { label: 'I prefer an independent cat that does their own thing.', tag: 'independent' },
  },
  {
    id: 4,
    title: 'Play Preference',
    optionA: { label: 'Toys and games all day — I want a cat who plays.', tag: 'playful' },
    optionB: { label: 'I want a cat who mostly chills and watches.', tag: 'low_play' },
  },
  {
    id: 5,
    title: 'Age',
    optionA: { label: "I'd like a young cat / kitten (under ~2 years).", tag: 'young' },
    optionB: { label: "I'd prefer an adult cat (2+ years).", tag: 'adult' },
  },
  {
    id: 6,
    title: 'Grooming & Maintenance',
    optionA: { label: "I don't mind regular brushing and grooming.", tag: 'high_groom' },
    optionB: { label: 'I want a low-maintenance coat.', tag: 'low_groom' },
  },
  {
    id: 7,
    title: 'Noise Tolerance',
    optionA: { label: "I don't mind a vocal cat (talkative/meows).", tag: 'vocal' },
    optionB: { label: 'I prefer a quiet cat.', tag: 'quiet' },
  },
  {
    id: 8,
    title: 'Household Fit',
    optionA: { label: 'My home has kids or other pets — I want a social, tolerant cat.', tag: 'good_with_kids_pets' },
    optionB: { label: 'My home is quiet — I want a cat for a calm environment.', tag: 'calm_home' },
  },
];
