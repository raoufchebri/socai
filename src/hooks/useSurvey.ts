'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SurveyData, SessionResponse, Question, Answer, SkipCondition } from '@/lib/survey-types';

const SESSION_TOKEN_KEY = 'stateofcode_session_token';

interface UseSurveyOptions {
  year: number;
}

interface UseSurveyReturn {
  // Data
  surveyData: SurveyData | null;
  answers: Record<string, Answer>;
  sessionToken: string | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  
  // Computed
  currentQuestions: Question[];
  totalQuestions: number;
  answeredCount: number;
  progressPercentage: number;
  
  // Actions
  saveAnswer: (questionSlug: string, answer: Answer) => Promise<void>;
  completeSession: () => Promise<void>;
  subscribeEmail: (email: string) => Promise<void>;
  
  // Helpers
  shouldShowQuestion: (question: Question) => boolean;
  getAnswer: (questionSlug: string) => Answer | undefined;
}

export function useSurvey({ year }: UseSurveyOptions): UseSurveyReturn {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load survey data and session on mount
  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch survey data
        const surveyRes = await fetch(`/api/surveys/${year}`);
        if (!surveyRes.ok) {
          const data = await surveyRes.json();
          throw new Error(data.error || 'Failed to load survey');
        }
        const surveyJson: SurveyData = await surveyRes.json();
        setSurveyData(surveyJson);

        // Check for existing session
        const storedToken = localStorage.getItem(`${SESSION_TOKEN_KEY}_${year}`);
        
        if (storedToken) {
          // Try to restore session
          const sessionRes = await fetch(`/api/sessions?token=${storedToken}`);
          if (sessionRes.ok) {
            const sessionJson: SessionResponse = await sessionRes.json();
            setSessionToken(sessionJson.session.token);
            setAnswers(sessionJson.answers);
          } else {
            // Invalid session, create new one
            await createNewSession(year);
          }
        } else if (surveyJson.survey.status === 'open') {
          // Create new session
          await createNewSession(year);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    async function createNewSession(surveyYear: number) {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyYear }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setSessionToken(data.token);
        localStorage.setItem(`${SESSION_TOKEN_KEY}_${surveyYear}`, data.token);
      }
    }

    initialize();
  }, [year]);

  // Check if a question should be shown based on skip conditions
  const shouldShowQuestion = useCallback((question: Question): boolean => {
    if (!question.skipCondition) return true;

    const condition = question.skipCondition;
    const previousAnswer = answers[condition.questionSlug];

    if (previousAnswer === undefined) return true;

    switch (condition.operator) {
      case 'equals':
        return previousAnswer !== condition.value;
      case 'not_equals':
        return previousAnswer === condition.value;
      case 'includes':
        if (Array.isArray(previousAnswer)) {
          const values = Array.isArray(condition.value) ? condition.value : [condition.value];
          return !values.some(v => previousAnswer.includes(v));
        }
        return true;
      case 'not_includes':
        if (Array.isArray(previousAnswer)) {
          const values = Array.isArray(condition.value) ? condition.value : [condition.value];
          return values.some(v => previousAnswer.includes(v));
        }
        return true;
      default:
        return true;
    }
  }, [answers]);

  // Get flattened list of visible questions
  const currentQuestions = surveyData?.categories.flatMap(cat => 
    cat.questions.filter(shouldShowQuestion)
  ) ?? [];

  const totalQuestions = currentQuestions.length;
  const answeredCount = Object.keys(answers).filter(slug => 
    currentQuestions.some(q => q.slug === slug)
  ).length;
  const progressPercentage = totalQuestions > 0 
    ? Math.round((answeredCount / totalQuestions) * 100) 
    : 0;

  // Save an answer
  const saveAnswer = useCallback(async (questionSlug: string, answer: Answer) => {
    if (!sessionToken) return;

    // Optimistically update local state
    setAnswers(prev => ({ ...prev, [questionSlug]: answer }));
    setIsSaving(true);

    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: sessionToken,
          questionSlug,
          answer,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save answer');
      }
    } catch (err) {
      // Revert on error
      setAnswers(prev => {
        const next = { ...prev };
        delete next[questionSlug];
        return next;
      });
      setError(err instanceof Error ? err.message : 'Failed to save answer');
    } finally {
      setIsSaving(false);
    }
  }, [sessionToken]);

  // Complete the session
  const completeSession = useCallback(async () => {
    if (!sessionToken) return;

    try {
      const res = await fetch('/api/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sessionToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete session');
    }
  }, [sessionToken]);

  // Subscribe email for notifications
  const subscribeEmail = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, surveyYear: year }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to subscribe');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      throw err;
    }
  }, [year]);

  // Get answer for a question
  const getAnswer = useCallback((questionSlug: string): Answer | undefined => {
    return answers[questionSlug];
  }, [answers]);

  return {
    surveyData,
    answers,
    sessionToken,
    isLoading,
    error,
    isSaving,
    currentQuestions,
    totalQuestions,
    answeredCount,
    progressPercentage,
    saveAnswer,
    completeSession,
    subscribeEmail,
    shouldShowQuestion,
    getAnswer,
  };
}

