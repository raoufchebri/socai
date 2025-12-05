// Types for survey data from API

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  allowCustomText?: boolean; // When true, shows a text input when this option is selected
}

export interface SkipCondition {
  questionSlug: string;
  operator: 'equals' | 'not_equals' | 'includes' | 'not_includes';
  value: string | string[];
}

export interface Question {
  id: number;
  slug: string;
  prompt: string;
  description: string | null;
  type: 'single' | 'multiple' | 'scale' | 'text';
  options: QuestionOption[] | null;
  categoryId: number;
  order: number;
  skipCondition: SkipCondition | null;
  scaleMin: number | null;
  scaleMax: number | null;
  scaleMinLabel: string | null;
  scaleMaxLabel: string | null;
  required?: boolean;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  questions: Question[];
}

export interface Survey {
  id: number;
  year: number;
  title: string;
  description: string | null;
  status: 'draft' | 'open' | 'closed';
  startDate: string | null;
  endDate: string | null;
}

export interface SurveyData {
  survey: Survey;
  categories: Category[];
  totalQuestions: number;
}

export interface SessionData {
  token: string;
  surveyId: number;
  surveyYear: number;
  startedAt: string;
  completedAt: string | null;
}

export interface SessionResponse {
  session: SessionData;
  answers: Record<string, string | string[] | number>;
  answeredCount: number;
}

export type Answer = string | string[] | number;




