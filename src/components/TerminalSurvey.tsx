'use client';

import { useState, useEffect, useCallback } from 'react';
import { surveyQuestions, Question, SurveySection, getTotalQuestions } from '@/data/surveyQuestions';

interface SurveyAnswers {
  [questionId: string]: string | string[] | number;
}

export default function TerminalSurvey() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMultiple, setSelectedMultiple] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const currentSection = surveyQuestions[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestions = getTotalQuestions();

  // Calculate progress
  const getAnsweredCount = useCallback(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const progressPercentage = Math.round((getAnsweredCount() / totalQuestions) * 100);

  // Get flat question index for display
  const getFlatQuestionIndex = useCallback(() => {
    let count = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      count += surveyQuestions[i].questions.length;
    }
    return count + currentQuestionIndex + 1;
  }, [currentSectionIndex, currentQuestionIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showIntro) {
        if (e.key === 'Enter') {
          setShowIntro(false);
        }
        return;
      }

      if (isComplete) return;

      if (!currentQuestion) return;

      const options = currentQuestion.options || [];
      const maxIndex = currentQuestion.type === 'scale' 
        ? (currentQuestion.scaleMax || 5) - (currentQuestion.scaleMin || 1)
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
            const optionId = options[selectedIndex].id;
            setSelectedMultiple(prev => {
              const newSet = new Set(prev);
              if (newSet.has(optionId)) {
                newSet.delete(optionId);
              } else {
                newSet.add(optionId);
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
          // Skip question
          e.preventDefault();
          goToNextQuestion();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIntro, isComplete, currentQuestion, selectedIndex, selectedMultiple]);

  const submitAnswer = () => {
    if (!currentQuestion) return;

    let answer: string | string[] | number;

    if (currentQuestion.type === 'single') {
      const options = currentQuestion.options || [];
      if (options[selectedIndex]) {
        answer = options[selectedIndex].value;
      } else return;
    } else if (currentQuestion.type === 'multiple') {
      if (selectedMultiple.size === 0) return;
      answer = Array.from(selectedMultiple);
    } else if (currentQuestion.type === 'scale') {
      answer = (currentQuestion.scaleMin || 1) + selectedIndex;
    } else {
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));

    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    setSelectedIndex(0);
    setSelectedMultiple(new Set());

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < surveyQuestions.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      setIsComplete(true);
    }
  };

  const renderIntro = () => (
    <div className="terminal-content">
      <div className="terminal-line terminal-prompt">
        <span className="text-accent-green">~</span> Welcome to the State of Vibe Engineering Survey
      </div>
      <div className="terminal-line mt-4 text-gray-400">
        This survey explores how developers use AI coding agents.
      </div>
      <div className="terminal-line text-gray-400">
        Your responses will help shape the future of developer tools.
      </div>
      <div className="terminal-line mt-6 text-gray-500">
        <span className="text-accent-cyan">ℹ</span> Estimated time: 5-10 minutes
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

  const renderComplete = () => (
    <div className="terminal-content">
      <div className="terminal-line terminal-prompt">
        <span className="text-accent-green">✓</span> Survey Complete!
      </div>
      <div className="terminal-line mt-4 text-gray-400">
        Thank you for participating in the State of Vibe Engineering survey.
      </div>
      <div className="terminal-line mt-2 text-gray-400">
        You answered {getAnsweredCount()} out of {totalQuestions} questions.
      </div>
      <div className="terminal-line mt-6 text-accent-cyan">
        Your responses have been recorded.
      </div>
      <div className="terminal-line mt-4 text-gray-500">
        Results will be published once the survey closes.
      </div>
    </div>
  );

  const renderQuestion = (question: Question) => {
    const options = question.options || [];

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

        {/* Options */}
        {question.type === 'scale' ? (
          <div className="mt-4 space-y-1">
            {Array.from({ length: (question.scaleMax || 5) - (question.scaleMin || 1) + 1 }).map((_, idx) => {
              const value = (question.scaleMin || 1) + idx;
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={idx}
                  className={`terminal-option ${isSelected ? 'terminal-option-selected' : ''}`}
                >
                  <span className="terminal-option-indicator">
                    {isSelected ? '●' : '○'}
                  </span>
                  <span className="terminal-option-label">
                    {value}
                    {idx === 0 && question.scaleLabels && (
                      <span className="text-gray-500 ml-2">({question.scaleLabels.min})</span>
                    )}
                    {idx === (question.scaleMax || 5) - (question.scaleMin || 1) && question.scaleLabels && (
                      <span className="text-gray-500 ml-2">({question.scaleLabels.max})</span>
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
                ? selectedMultiple.has(option.id)
                : isHighlighted;
              
              return (
                <div
                  key={option.id}
                  className={`terminal-option ${isHighlighted ? 'terminal-option-selected' : ''}`}
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
        </div>
      </div>
    );
  };

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
          state-of-vibe-engineering.sh
        </div>
        <div className="terminal-status">
          {!showIntro && !isComplete && (
            <span className="text-accent-cyan text-xs font-mono">
              {progressPercentage}% complete
            </span>
          )}
        </div>
      </div>

      {/* Section indicator */}
      {!showIntro && !isComplete && currentSection && (
        <div className="terminal-section-bar">
          <div className="terminal-section-info">
            <span className="text-accent-purple font-semibold">{currentSection.title}</span>
            <span className="text-gray-500 mx-2">·</span>
            <span className="text-gray-400 text-sm">{currentSection.description}</span>
          </div>
          <div className="terminal-progress-info">
            <span className="text-gray-500 text-sm">
              Question {getFlatQuestionIndex()} of {totalQuestions}
            </span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!showIntro && (
        <div className="terminal-progress">
          <div 
            className="terminal-progress-bar" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      )}

      {/* Main content */}
      <div className="terminal-body">
        {showIntro && renderIntro()}
        {!showIntro && isComplete && renderComplete()}
        {!showIntro && !isComplete && currentQuestion && renderQuestion(currentQuestion)}
      </div>

      {/* Terminal footer */}
      <div className="terminal-footer">
        <span className="text-gray-600 text-xs font-mono">
          State of Vibe Engineering 2025
        </span>
      </div>
    </div>
  );
}

