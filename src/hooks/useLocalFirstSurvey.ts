'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SurveyData, Question, Answer } from '@/lib/survey-types';

const LOCAL_ANSWERS_KEY = 'stateofcode_local_answers';
const SESSION_TOKEN_KEY = 'stateofcode_session_token';

interface UseLocalFirstSurveyOptions {
  year: number;
}

interface UseLocalFirstSurveyReturn {
  // Data
  surveyData: SurveyData | null;
  answers: Record<string, Answer>;
  sessionToken: string | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
  isCompleted: boolean;
  
  // Computed
  currentQuestions: Question[];
  totalQuestions: number;
  answeredCount: number;
  progressPercentage: number;
  
  // Actions
  saveAnswer: (questionSlug: string, answer: Answer) => void;
  submitAllAnswers: () => Promise<void>;
  subscribeEmail: (email: string) => Promise<void>;
  
  // Helpers
  shouldShowQuestion: (question: Question) => boolean;
  getAnswer: (questionSlug: string) => Answer | undefined;
}

export function useLocalFirstSurvey({ year }: UseLocalFirstSurveyOptions): UseLocalFirstSurveyReturn {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [serverAnswers, setServerAnswers] = useState<Record<string, Answer>>({});
  
  const initialLoadComplete = useRef(false);

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = Object.keys(answers).some(
    slug => JSON.stringify(answers[slug]) !== JSON.stringify(serverAnswers[slug])
  );

  // Load local answers from localStorage
  const loadLocalAnswers = useCallback((surveyYear: number): Record<string, Answer> => {
    try {
      const stored = localStorage.getItem(`${LOCAL_ANSWERS_KEY}_${surveyYear}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load local answers:', e);
    }
    return {};
  }, []);

  // Save answers to localStorage
  const saveLocalAnswers = useCallback((surveyYear: number, answersToSave: Record<string, Answer>) => {
    try {
      localStorage.setItem(`${LOCAL_ANSWERS_KEY}_${surveyYear}`, JSON.stringify(answersToSave));
    } catch (e) {
      console.error('Failed to save local answers:', e);
    }
  }, []);

  // Load survey data and session on mount
  useEffect(() => {
    async function initialize() {
      if (initialLoadComplete.current) return;
      
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

        // Load local answers first (instant)
        const localAnswers = loadLocalAnswers(year);
        
        // Check for existing session
        const storedToken = localStorage.getItem(`${SESSION_TOKEN_KEY}_${year}`);
        
        if (storedToken) {
          // Try to restore session
          const sessionRes = await fetch(`/api/sessions?token=${storedToken}`);
          if (sessionRes.ok) {
            const sessionJson = await sessionRes.json();
            setSessionToken(sessionJson.session.token);
            
            // Check if session was already completed
            if (sessionJson.session.completedAt) {
              setIsCompleted(true);
              // Load server answers for display
              const serverAns = sessionJson.answers || {};
              setServerAnswers(serverAns);
              setAnswers(serverAns);
            } else {
              // Merge server answers with local (local takes precedence for newer changes)
              const serverAns = sessionJson.answers || {};
              setServerAnswers(serverAns);
              
              // Combine: use local if exists, otherwise use server
              const combined = { ...serverAns, ...localAnswers };
              setAnswers(combined);
              saveLocalAnswers(year, combined);
            }
          } else {
            // Invalid session, create new one
            await createNewSession(year);
            setAnswers(localAnswers);
          }
        } else if (surveyJson.survey.status === 'open') {
          // Create new session
          await createNewSession(year);
          setAnswers(localAnswers);
        }
        
        initialLoadComplete.current = true;
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
      } else if (res.status === 403) {
        // Already completed from this IP
        const data = await res.json();
        if (data.alreadyCompleted) {
          setIsCompleted(true);
          setError('You have already submitted this survey');
        }
      }
    }

    initialize();
  }, [year, loadLocalAnswers, saveLocalAnswers]);

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

  // Save an answer locally (instant, no network)
  const saveAnswer = useCallback((questionSlug: string, answer: Answer) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionSlug]: answer };
      saveLocalAnswers(year, updated);
      return updated;
    });
  }, [year, saveLocalAnswers]);

  // Submit all answers to the server at once
  const submitAllAnswers = useCallback(async () => {
    if (!sessionToken) {
      setError('No active session');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit all answers in a batch
      const res = await fetch('/api/responses/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: sessionToken,
          answers,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit answers');
      }

      // Mark session as complete
      const completeRes = await fetch('/api/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sessionToken }),
      });

      if (!completeRes.ok) {
        const data = await completeRes.json();
        throw new Error(data.error || 'Failed to complete session');
      }

      // Update server answers to match local
      setServerAnswers({ ...answers });
      setIsCompleted(true);
      
      // Clear local storage after successful submission
      localStorage.removeItem(`${LOCAL_ANSWERS_KEY}_${year}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answers');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionToken, answers, year]);

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
    isSubmitting,
    hasUnsavedChanges,
    isCompleted,
    currentQuestions,
    totalQuestions,
    answeredCount,
    progressPercentage,
    saveAnswer,
    submitAllAnswers,
    subscribeEmail,
    shouldShowQuestion,
    getAnswer,
  };
}
