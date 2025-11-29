'use client';

// TODO: Electric sync feature - requires @tanstack/react-db and uuid packages
// This is a stub implementation until dependencies are installed

import type { Question } from '@/lib/survey-types';

type Answer = string | string[] | number;

interface UseElectricSurveyOptions {
  year: number;
}

interface UseElectricSurveyReturn {
  survey: { id: number; year: number; title: string; description: string | null; status: string } | null;
  categories: { id: number; slug: string; name: string; description: string | null; order: number }[];
  questions: Question[];
  answers: Record<string, Answer>;
  sessionToken: string | null;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
  currentQuestions: Question[];
  totalQuestions: number;
  answeredCount: number;
  progressPercentage: number;
  saveAnswer: (questionSlug: string, answer: Answer) => void;
  completeSession: () => Promise<void>;
  subscribeEmail: (email: string) => Promise<void>;
  shouldShowQuestion: (question: Question) => boolean;
  getAnswer: (questionSlug: string) => Answer | undefined;
}

export function useElectricSurvey({ year }: UseElectricSurveyOptions): UseElectricSurveyReturn {
  // Stub implementation - Electric sync not yet available
  console.warn(`useElectricSurvey: Electric sync feature is not yet implemented for year ${year}`);
  
  return {
    survey: null,
    categories: [],
    questions: [],
    answers: {},
    sessionToken: null,
    isLoading: false,
    error: 'Electric sync feature is not yet implemented',
    isSyncing: false,
    currentQuestions: [],
    totalQuestions: 0,
    answeredCount: 0,
    progressPercentage: 0,
    saveAnswer: () => {},
    completeSession: async () => {},
    subscribeEmail: async () => {},
    shouldShowQuestion: () => true,
    getAnswer: () => undefined,
  };
}
