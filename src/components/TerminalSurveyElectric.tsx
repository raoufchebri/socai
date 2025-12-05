'use client';

import { useState, useEffect, useMemo } from 'react';
import { useElectricSurvey } from '@/hooks/useElectricSurvey';
import type { Question } from '@/lib/survey-types';

interface TerminalSurveyElectricProps {
  year: number;
}

type SurveyPhase = 'intro' | 'questions' | 'recap' | 'complete';
type Answer = string | string[] | number;

export default function TerminalSurveyElectric({ year }: TerminalSurveyElectricProps) {
  const {
    survey,
    categories,
    questions,
    isLoading,
    error,
    isSyncing,
    currentQuestions,
    totalQuestions,
    answeredCount,
    progressPercentage,
    saveAnswer,
    completeSession,
    subscribeEmail,
    shouldShowQuestion,
    getAnswer,
  } = useElectricSurvey({ year });

  const [phase, setPhase] = useState<SurveyPhase>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMultiple, setSelectedMultiple] = useState<Set<string>>(new Set());
  const [textInput, setTextInput] = useState('');
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Get current question
  const currentQuestion = currentQuestions[currentQuestionIndex];

  // Get current category
  const currentCategory = useMemo(() => {
    if (!categories.length || !currentQuestion) return null;
    return categories.find(cat => cat.id === currentQuestion.categoryId);
  }, [categories, currentQuestion]);

  // Reset selection when question changes
  useEffect(() => {
    if (currentQuestion) {
      setSelectedIndex(0);
      setSelectedMultiple(new Set());
      setTextInput('');
      
      // Pre-populate from existing answer
      const existingAnswer = getAnswer(currentQuestion.slug);
      if (existingAnswer !== undefined) {
        if (currentQuestion.type === 'multiple' && Array.isArray(existingAnswer)) {
          setSelectedMultiple(new Set(existingAnswer as string[]));
        } else if (currentQuestion.type === 'text' && typeof existingAnswer === 'string') {
          setTextInput(existingAnswer);
        } else if (currentQuestion.type === 'scale' && typeof existingAnswer === 'number') {
          const min = currentQuestion.scaleMin ?? 1;
          setSelectedIndex(existingAnswer - min);
        } else if (currentQuestion.type === 'single' && currentQuestion.options) {
          const options = currentQuestion.options as { value: string }[];
          const idx = options.findIndex(o => o.value === existingAnswer);
          if (idx >= 0) setSelectedIndex(idx);
        }
      }
    }
  }, [currentQuestion, getAnswer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter' && phase === 'complete') {
          e.preventDefault();
          handleEmailSubmit();
        }
        return;
      }

      if (phase === 'intro') {
        if (e.key === 'Enter') {
          setPhase('questions');
        }
        return;
      }

      if (phase === 'recap') {
        if (e.key === 'Enter') {
          handleComplete();
        }
        return;
      }

      if (phase !== 'questions' || !currentQuestion) return;

      const options = (currentQuestion.options as { id: string; value: string; label: string }[]) || [];
      const maxIndex = currentQuestion.type === 'scale'
        ? (currentQuestion.scaleMax ?? 5) - (currentQuestion.scaleMin ?? 1)
        : options.length - 1;

      switch (e.key) {
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(maxIndex, prev + 1));
          break;
        case ' ':
          e.preventDefault();
          if (currentQuestion.type === 'multiple' && options[selectedIndex]) {
            const optionValue = options[selectedIndex].value;
            setSelectedMultiple(prev => {
              const newSet = new Set(prev);
              if (newSet.has(optionValue)) {
                newSet.delete(optionValue);
              } else {
                newSet.add(optionValue);
              }
              return newSet;
            });
          }
          break;
        case 'Enter':
          e.preventDefault();
          submitAnswer();
          break;
        case 's':
          e.preventDefault();
          goToNextQuestion();
          break;
        case 'Backspace':
        case 'b':
          e.preventDefault();
          goToPreviousQuestion();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally minimal deps for keyboard handler stability
  }, [phase, currentQuestion, selectedIndex, selectedMultiple]);

  const submitAnswer = () => {
    if (!currentQuestion) return;

    let answer: Answer;
    const options = (currentQuestion.options as { id: string; value: string; label: string }[]) || [];

    if (currentQuestion.type === 'single') {
      if (!options[selectedIndex]) return;
      answer = options[selectedIndex].value;
    } else if (currentQuestion.type === 'multiple') {
      if (selectedMultiple.size === 0) {
        goToNextQuestion();
        return;
      }
      answer = Array.from(selectedMultiple);
    } else if (currentQuestion.type === 'scale') {
      answer = (currentQuestion.scaleMin ?? 1) + selectedIndex;
    } else if (currentQuestion.type === 'text') {
      if (!textInput.trim()) {
        goToNextQuestion();
        return;
      }
      answer = textInput.trim();
    } else {
      return;
    }

    // This is now INSTANT - no network wait!
    saveAnswer(currentQuestion.slug, answer);
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setPhase('recap');
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setPhase('questions');
  };

  const handleComplete = async () => {
    await completeSession();
    setPhase('complete');
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;
    try {
      await subscribeEmail(email.trim());
      setEmailSubmitted(true);
    } catch {
      // Error handled in hook
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="terminal-btn terminal-btn-red"></span>
            <span className="terminal-btn terminal-btn-yellow"></span>
            <span className="terminal-btn terminal-btn-green"></span>
          </div>
          <div className="terminal-title">syncing...</div>
          <div className="terminal-status">
            <span className="text-accent-cyan text-xs font-mono animate-pulse">⚡ Electric</span>
          </div>
        </div>
        <div className="terminal-body flex items-center justify-center">
          <div className="text-accent-cyan font-mono animate-pulse">
            Syncing survey data...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !survey) {
    return (
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="terminal-btn terminal-btn-red"></span>
            <span className="terminal-btn terminal-btn-yellow"></span>
            <span className="terminal-btn terminal-btn-green"></span>
          </div>
          <div className="terminal-title">error</div>
          <div className="terminal-status"></div>
        </div>
        <div className="terminal-body">
          <div className="text-red-400 font-mono">
            <span className="text-red-500">✗</span> {error || 'Survey not found'}
          </div>
        </div>
      </div>
    );
  }

  // Survey closed state
  if (survey.status === 'closed') {
    return (
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="terminal-btn terminal-btn-red"></span>
            <span className="terminal-btn terminal-btn-yellow"></span>
            <span className="terminal-btn terminal-btn-green"></span>
          </div>
          <div className="terminal-title">survey-closed.txt</div>
          <div className="terminal-status"></div>
        </div>
        <div className="terminal-body">
          <div className="terminal-content">
            <div className="terminal-line terminal-prompt">
              <span className="text-yellow-400">⚠</span> Survey Closed
            </div>
            <div className="terminal-line mt-4 text-gray-400">
              The {survey.title} survey has ended.
            </div>
            <div className="terminal-line text-gray-400">
              Results will be published soon.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderIntro = () => (
    <div className="terminal-content">
      <div className="terminal-line terminal-prompt">
        <span className="text-accent-green">~</span> Welcome to {survey.title}
      </div>
      <div className="terminal-line mt-4 text-gray-400">
        {survey.description || 'This survey explores how developers use AI coding agents.'}
      </div>
      <div className="terminal-line mt-6 text-gray-500">
        <span className="text-accent-cyan">⚡</span> Powered by Electric SQL — works offline!
      </div>
      <div className="terminal-line text-gray-500">
        <span className="text-accent-cyan">ℹ</span> {totalQuestions} questions across {categories.length} categories
      </div>
      <div className="terminal-line text-gray-500">
        <span className="text-accent-cyan">ℹ</span> All questions can be skipped
      </div>
      <div className="terminal-line mt-8">
        <span className="terminal-cursor"></span>
        <span className="text-accent-green ml-2">Press ENTER to begin</span>
      </div>
    </div>
  );

  const renderQuestion = (question: Question) => {
    const options = (question.options as { id: string; value: string; label: string }[]) || [];

    return (
      <div className="terminal-content">
        {/* Question prompt */}
        <div className="terminal-line terminal-prompt mb-2">
          <span className="text-accent-purple">?</span> {question.prompt}
        </div>

        {question.description && (
          <div className="terminal-line text-gray-500 text-sm mb-4">
            {question.description}
          </div>
        )}

        {/* Options based on type */}
        {question.type === 'text' ? (
          <div className="mt-4">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 font-mono focus:outline-none focus:border-accent-cyan"
              placeholder="Type your answer..."
              autoFocus
            />
          </div>
        ) : question.type === 'scale' ? (
          <div className="mt-4 space-y-1">
            {Array.from({ length: (question.scaleMax ?? 5) - (question.scaleMin ?? 1) + 1 }).map((_, idx) => {
              const value = (question.scaleMin ?? 1) + idx;
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={idx}
                  className={`terminal-option ${isSelected ? 'terminal-option-selected' : ''}`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <span className="terminal-option-indicator">
                    {isSelected ? '●' : '○'}
                  </span>
                  <span className="terminal-option-label">
                    {value}
                    {idx === 0 && question.scaleMinLabel && (
                      <span className="text-gray-500 ml-2">({question.scaleMinLabel})</span>
                    )}
                    {idx === (question.scaleMax ?? 5) - (question.scaleMin ?? 1) && question.scaleMaxLabel && (
                      <span className="text-gray-500 ml-2">({question.scaleMaxLabel})</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 space-y-1">
            {options.map((option, idx) => {
              const isHighlighted = selectedIndex === idx;
              const isChecked = question.type === 'multiple'
                ? selectedMultiple.has(option.value)
                : isHighlighted;

              return (
                <div
                  key={option.id}
                  className={`terminal-option ${isHighlighted ? 'terminal-option-selected' : ''}`}
                  onClick={() => {
                    setSelectedIndex(idx);
                    if (question.type === 'multiple') {
                      setSelectedMultiple(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(option.value)) {
                          newSet.delete(option.value);
                        } else {
                          newSet.add(option.value);
                        }
                        return newSet;
                      });
                    }
                  }}
                >
                  <span className="terminal-option-indicator">
                    {question.type === 'multiple'
                      ? (isChecked ? '◉' : '○')
                      : (isHighlighted ? '›' : ' ')}
                  </span>
                  <span className="terminal-option-label">{option.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Keyboard hints */}
        <div className="terminal-hints mt-8">
          <span className="terminal-hint">
            <kbd>↑↓</kbd> navigate
          </span>
          {question.type === 'multiple' && (
            <span className="terminal-hint">
              <kbd>space</kbd> select
            </span>
          )}
          <span className="terminal-hint">
            <kbd>enter</kbd> submit
          </span>
          <span className="terminal-hint">
            <kbd>s</kbd> skip
          </span>
          <span className="terminal-hint">
            <kbd>b</kbd> back
          </span>
        </div>
      </div>
    );
  };

  const renderRecap = () => (
    <div className="terminal-content">
      <div className="terminal-line terminal-prompt mb-4">
        <span className="text-accent-cyan">📋</span> Review Your Answers
      </div>

      <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
        {categories.map(category => {
          const categoryQuestions = questions
            .filter(q => q.categoryId === category.id)
            .filter(shouldShowQuestion);
          if (categoryQuestions.length === 0) return null;

          return (
            <div key={category.id}>
              <div className="text-accent-purple font-mono text-sm mb-2">
                {category.name}
              </div>
              <div className="space-y-2 pl-4 border-l border-gray-700">
                {categoryQuestions.map((q) => {
                  const answer = getAnswer(q.slug);
                  const questionIndex = currentQuestions.findIndex(cq => cq.slug === q.slug);
                  
                  return (
                    <div
                      key={q.id}
                      className="flex items-start gap-3 text-sm cursor-pointer hover:bg-gray-800/30 p-2 rounded"
                      onClick={() => goToQuestion(questionIndex)}
                    >
                      <span className="text-gray-600 flex-shrink-0">
                        {answer !== undefined ? '✓' : '○'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-300 truncate">{q.prompt}</div>
                        {answer !== undefined && (
                          <div className="text-accent-cyan text-xs mt-1">
                            {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                          </div>
                        )}
                      </div>
                      <span className="text-gray-600 text-xs">edit →</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-700">
        <div className="text-gray-400 text-sm mb-4">
          You answered {answeredCount} of {totalQuestions} questions
        </div>
        <div className="terminal-line">
          <span className="text-accent-green">Press ENTER to submit survey</span>
        </div>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="terminal-content">
      <div className="terminal-line terminal-prompt">
        <span className="text-accent-green">✓</span> Survey Complete!
      </div>
      <div className="terminal-line mt-4 text-gray-400">
        Thank you for participating in the {survey.title}.
      </div>
      <div className="terminal-line mt-2 text-gray-400">
        You answered {answeredCount} out of {totalQuestions} questions.
      </div>

      {!emailSubmitted ? (
        <div className="mt-8">
          <div className="text-gray-300 mb-3">
            Want to be notified when results are published?
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEmailSubmit();
                }
              }}
              className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:border-accent-cyan"
              placeholder="your@email.com"
            />
            <button
              onClick={handleEmailSubmit}
              className="px-4 py-2 bg-accent-cyan/20 border border-accent-cyan/40 rounded-lg text-accent-cyan font-mono text-sm hover:bg-accent-cyan/30 transition-colors"
            >
              Notify me
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-accent-green">
          <span>✓</span> You&apos;ll be notified when results are ready!
        </div>
      )}

      <div className="terminal-line mt-8 text-gray-500">
        Results will be published once the survey closes.
      </div>
    </div>
  );

  return (
    <div className="terminal-container">
      {/* Terminal header */}
      <div className="terminal-header">
        <div className="terminal-buttons">
          <span className="terminal-btn terminal-btn-red"></span>
          <span className="terminal-btn terminal-btn-yellow"></span>
          <span className="terminal-btn terminal-btn-green"></span>
        </div>
        <div className="terminal-title">
          stateofcode-{year}.sh
        </div>
        <div className="terminal-status">
          {phase === 'questions' && (
            <span className="text-accent-cyan text-xs font-mono">
              {progressPercentage}%
              {isSyncing && <span className="ml-2 text-yellow-400 animate-pulse">⚡</span>}
            </span>
          )}
        </div>
      </div>

      {/* Section indicator */}
      {phase === 'questions' && currentCategory && (
        <div className="terminal-section-bar">
          <div className="terminal-section-info">
            <span className="text-accent-purple font-semibold">{currentCategory.name}</span>
            {currentCategory.description && (
              <>
                <span className="text-gray-500 mx-2">·</span>
                <span className="text-gray-400 text-sm">{currentCategory.description}</span>
              </>
            )}
          </div>
          <div className="terminal-progress-info">
            <span className="text-gray-500 text-sm">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {phase !== 'intro' && (
        <div className="terminal-progress">
          <div
            className="terminal-progress-bar"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      )}

      {/* Main content */}
      <div className="terminal-body">
        {phase === 'intro' && renderIntro()}
        {phase === 'questions' && currentQuestion && renderQuestion(currentQuestion)}
        {phase === 'recap' && renderRecap()}
        {phase === 'complete' && renderComplete()}
      </div>

      {/* Terminal footer */}
      <div className="terminal-footer">
        <span className="text-gray-600 text-xs font-mono">
          stateofcode.ai · {year} · ⚡ Electric SQL
        </span>
      </div>
    </div>
  );
}

