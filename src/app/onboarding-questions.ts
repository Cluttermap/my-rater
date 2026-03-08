export interface OnboardingQuestion {
  id: string;
  /** Static string or a function that gets all previous answers and returns a string. Return null/undefined to show nothing. */
  intro?: string | ((answers: Record<string, string>) => string | null);
  question: string;
  answers: string[];
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'personality',
    question: 'Are you a fucking cunt or a stupid dick?',
    answers: ['Fucking cunt', 'Stupid dick', 'Neither'],
  },
  {
    id: 'goat',
    intro: (a) => a['personality'] === 'Neither'
      ? 'If you think neither you are both (fucking cunt and stupid dick)'
      : null,
    question: 'Have you ever fucked a goat?',
    answers: ['Yes', 'No', 'Not sure'],
  },
  {
    id: 'dev_years',
    question: 'How long do you think you\'ll be working as a software developer?',
    answers: ['1 year', '2 years', '3 years', 'I\'m not a software developer'],
  },
  {
    id: 'ai_dude',
    intro: (a) => a['dev_years'] === "I'm not a software developer"
      ? 'pff then you are really a fucking cunt'
      : null,
    question: 'If AI was a dude, I would',
    answers: ['Fuck him', 'Suck his cock', 'Make him suck my cock'],
  },
  // Add more questions here — just follow the same structure.
  // The `intro` field can reference any previous answer via `a['question-id']`.
];

export const ONBOARDING_SUMMARY_TEXTS = [
  'What a proper LOSER you are says your answers',
  'It seems based on your answers that you SUCK BALLS',
  'Jeez, you are really just a CUNT judging by your answers',
  'Pfff I fink it wasnt worf taking the quizz cause you are nofin but a CRAP SUCKING LITTLE NIPPA',
];
