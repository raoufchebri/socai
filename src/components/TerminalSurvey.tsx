'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocalFirstSurvey } from '@/hooks/useLocalFirstSurvey';
import type { Question, Answer } from '@/lib/survey-types';

interface TerminalSurveyProps {
  year: number;
}

type SurveyPhase = 'intro' | 'questions' | 'recap' | 'complete';

export default function TerminalSurvey({ year }: TerminalSurveyProps) {
  const {
    surveyData,
    isLoading,
    error,
    isSubmitting,
    currentQuestions,
    totalQuestions,
    answeredCount,
    progressPercentage,
    saveAnswer,
    submitAllAnswers,
    subscribeEmail,
    shouldShowQuestion,
    getAnswer,
  } = useLocalFirstSurvey({ year });

  const [phase, setPhase] = useState<SurveyPhase>('intro');
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionIndexInCategory, setCurrentQuestionIndexInCategory] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMultiple, setSelectedMultiple] = useState<Set<string>>(new Set());
  const [textInput, setTextInput] = useState('');
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Shortcut keys: 1-9, 0, then letters (excluding reserved: j, k, s, b)
  const LETTER_SHORTCUTS = 'acdefghilmnopqrtuvwxyz'.split('');
  const getShortcutKey = (index: number): string | null => {
    if (index < 9) return String(index + 1); // 1-9
    if (index === 9) return '0'; // 10th option
    const letterIndex = index - 10;
    if (letterIndex < LETTER_SHORTCUTS.length) return LETTER_SHORTCUTS[letterIndex];
    return null;
  };

  const getIndexFromKey = (key: string): number | null => {
    // Number keys
    if (key === '0') return 9;
    const num = parseInt(key, 10);
    if (!isNaN(num) && num >= 1 && num <= 9) return num - 1;
    // Letter keys
    const letterIndex = LETTER_SHORTCUTS.indexOf(key.toLowerCase());
    if (letterIndex >= 0) return 10 + letterIndex;
    return null;
  };

  // Get categories with their questions
  const categoriesWithQuestions = useMemo(() => {
    if (!surveyData) return [];
    return surveyData.categories.map(category => {
      const questions = category.questions.filter(shouldShowQuestion);
      const answeredQuestions = questions.filter(q => getAnswer(q.slug) !== undefined);
      return {
        ...category,
        questions,
        answeredCount: answeredQuestions.length,
        isComplete: questions.length > 0 && answeredQuestions.length === questions.length,
      };
    }).filter(cat => cat.questions.length > 0);
  }, [surveyData, shouldShowQuestion, getAnswer]);

  // Get current category and question
  const currentCategory = categoriesWithQuestions[currentCategoryIndex];
  const questionsInCurrentCategory = currentCategory?.questions || [];
  const currentQuestion = questionsInCurrentCategory[currentQuestionIndexInCategory];

  // Check if current category is AI Coding Tools (uses matrix view)
  const isAIToolsCategory = currentCategory?.slug === 'ai-tools';

  // Group AI tools questions by prefix for matrix view
  const aiToolsGroups = useMemo(() => {
    if (!isAIToolsCategory || !currentCategory) return null;
    
    const groups = [
      { id: 'ai-ide', title: 'AI IDEs', prefix: 'ai-ide-', questions: [] as Question[], otherQuestion: null as Question | null, satisfactionQuestion: null as Question | null, painPointsQuestion: null as Question | null },
      { id: 'ext', title: 'Extensions', prefix: 'ext-', questions: [] as Question[], otherQuestion: null as Question | null, satisfactionQuestion: null as Question | null, painPointsQuestion: null as Question | null },
      { id: 'agent', title: 'Autonomous Agents', prefix: 'agent-', questions: [] as Question[], otherQuestion: null as Question | null, satisfactionQuestion: null as Question | null, painPointsQuestion: null as Question | null },
      { id: 'builder', title: 'App Builders', prefix: 'builder-', questions: [] as Question[], otherQuestion: null as Question | null, satisfactionQuestion: null as Question | null, painPointsQuestion: null as Question | null },
      { id: 'model', title: 'AI Models', prefix: 'model-', questions: [] as Question[], otherQuestion: null as Question | null, satisfactionQuestion: null as Question | null, painPointsQuestion: null as Question | null },
    ];
    
    currentCategory.questions.forEach(q => {
      const group = groups.find(g => q.slug.startsWith(g.prefix));
      if (group) {
        if (q.slug.endsWith('-other') && q.type === 'text') {
          group.otherQuestion = q;
        } else if (q.slug.endsWith('-satisfaction') && q.type === 'scale') {
          group.satisfactionQuestion = q;
        } else if (q.slug.endsWith('-pain-points') && q.type === 'text') {
          group.painPointsQuestion = q;
        } else if (q.type === 'single') {
          group.questions.push(q);
        }
      }
    });
    
    return { groups: groups.filter(g => g.questions.length > 0) };
  }, [isAIToolsCategory, currentCategory]);

  // State for matrix view - track answers for all tools
  const [matrixAnswers, setMatrixAnswers] = useState<Record<string, string>>({});
  const [otherInputs, setOtherInputs] = useState<Record<string, string>>({});
  
  // State for ASCII matrix navigation
  const [matrixGroupIndex, setMatrixGroupIndex] = useState(0);
  const [matrixRowIndex, setMatrixRowIndex] = useState(0);
  const [matrixColIndex, setMatrixColIndex] = useState(0);
  const [isInOtherInput, setIsInOtherInput] = useState(false);
  const [isInOverallSection, setIsInOverallSection] = useState(false);
  const [overallQuestionIndex, setOverallQuestionIndex] = useState(0);

  // Initialize matrix answers from saved answers
  useEffect(() => {
    if (isAIToolsCategory && currentCategory) {
      const initialAnswers: Record<string, string> = {};
      const initialOthers: Record<string, string> = {};
      currentCategory.questions.forEach(q => {
        const answer = getAnswer(q.slug);
        if (answer !== undefined) {
          if (q.type === 'text' && typeof answer === 'string') {
            initialOthers[q.slug] = answer;
          } else if (typeof answer === 'string') {
            initialAnswers[q.slug] = answer;
          }
        }
      });
      setMatrixAnswers(initialAnswers);
      setOtherInputs(initialOthers);
    }
  }, [isAIToolsCategory, currentCategory, getAnswer]);

  // For backward compatibility - global question index
  const currentQuestionIndex = useMemo(() => {
    if (!currentQuestion) return 0;
    return currentQuestions.findIndex(q => q.slug === currentQuestion.slug);
  }, [currentQuestions, currentQuestion]);

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
          const idx = currentQuestion.options.findIndex(o => o.value === existingAnswer);
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

      if (phase !== 'questions') return;

      // Tab navigation shortcuts (work in any context)
      // [ or ArrowLeft with Ctrl/Meta = previous tab
      // ] or ArrowRight with Ctrl/Meta = next tab
      if (e.key === '[' || (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        goToPreviousCategory();
        return;
      }
      if (e.key === ']' || (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        goToNextCategory();
        return;
      }

      // Matrix navigation for AI Tools category
      if (isAIToolsCategory && aiToolsGroups && 'groups' in aiToolsGroups) {
        const { groups } = aiToolsGroups;
        const currentGroup = groups[matrixGroupIndex];
        const optionValues = ['never-heard', 'heard', 'used'];
        
        // Skip if we're in a text input
        if (isInOtherInput) {
          if (e.key === 'Escape') {
            e.preventDefault();
            setIsInOtherInput(false);
          }
          return;
        }

        // Navigation within overall section
        if (isInOverallSection) {
          if (e.key === 'ArrowUp' || e.key === 'k') {
            e.preventDefault();
            if (overallQuestionIndex > 0) {
              setOverallQuestionIndex(prev => prev - 1);
            } else {
              // Go back to last group
              setIsInOverallSection(false);
              setMatrixGroupIndex(groups.length - 1);
              const lastGroup = groups[groups.length - 1];
              setMatrixRowIndex(lastGroup.questions.length - 1);
            }
          } else if (e.key === 'Enter') {
            e.preventDefault();
            handleMatrixComplete();
          }
          return;
        }

        // Row navigation (up/down)
        if (e.key === 'ArrowUp' || e.key === 'k') {
          e.preventDefault();
          if (matrixRowIndex > 0) {
            setMatrixRowIndex(prev => prev - 1);
          } else if (matrixGroupIndex > 0) {
            // Move to previous group's last row
            const prevGroup = groups[matrixGroupIndex - 1];
            setMatrixGroupIndex(prev => prev - 1);
            setMatrixRowIndex(prevGroup.questions.length - 1);
          }
          return;
        }
        
        if (e.key === 'ArrowDown' || e.key === 'j') {
          e.preventDefault();
          if (currentGroup && matrixRowIndex < currentGroup.questions.length - 1) {
            setMatrixRowIndex(prev => prev + 1);
          } else if (matrixGroupIndex < groups.length - 1) {
            // Move to next group's first row
            setMatrixGroupIndex(prev => prev + 1);
            setMatrixRowIndex(0);
          }
          return;
        }

        // Column navigation (left/right)
        if (e.key === 'ArrowLeft' || e.key === 'h') {
          e.preventDefault();
          setMatrixColIndex(prev => Math.max(0, prev - 1));
          return;
        }
        
        if (e.key === 'ArrowRight' || e.key === 'l') {
          e.preventDefault();
          setMatrixColIndex(prev => Math.min(2, prev + 1));
          return;
        }

        // Quick select with number keys (1=Never, 2=Heard, 3=Used)
        if (['1', '2', '3'].includes(e.key)) {
          e.preventDefault();
          const colIdx = parseInt(e.key) - 1;
          if (currentGroup) {
            const q = currentGroup.questions[matrixRowIndex];
            if (q) {
              handleMatrixAnswer(q.slug, optionValues[colIdx]);
              setMatrixColIndex(colIdx);
            }
          }
          return;
        }

        // Quick select with letter keys (n=Never, h=Heard, u=Used)
        if (['n', 'h', 'u'].includes(e.key.toLowerCase()) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const keyMap: Record<string, number> = { 'n': 0, 'h': 1, 'u': 2 };
          const colIdx = keyMap[e.key.toLowerCase()];
          if (currentGroup) {
            const q = currentGroup.questions[matrixRowIndex];
            if (q) {
              handleMatrixAnswer(q.slug, optionValues[colIdx]);
              setMatrixColIndex(colIdx);
            }
          }
          return;
        }

        // Space to select current cell
        if (e.key === ' ') {
          e.preventDefault();
          if (currentGroup) {
            const q = currentGroup.questions[matrixRowIndex];
            if (q) {
              handleMatrixAnswer(q.slug, optionValues[matrixColIndex]);
            }
          }
          return;
        }
        
        // Enter to continue to next section
        if (e.key === 'Enter') {
          e.preventDefault();
          handleMatrixComplete();
          return;
        }

        // Tab to enter "Other" input
        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          if (currentGroup?.otherQuestion) {
            setIsInOtherInput(true);
          }
          return;
        }

        // 's' to skip to next group
        if (e.key === 's') {
          e.preventDefault();
          if (matrixGroupIndex < groups.length - 1) {
            setMatrixGroupIndex(prev => prev + 1);
            setMatrixRowIndex(0);
          } else {
            handleMatrixComplete();
          }
          return;
        }

        return;
      }

      // Standard question handling (non-matrix)
      if (!currentQuestion) return;

      const options = currentQuestion.options || [];
      const maxIndex = currentQuestion.type === 'scale'
        ? (currentQuestion.scaleMax ?? 5) - (currentQuestion.scaleMin ?? 1)
        : options.length - 1;

      // Handle shortcut keys (1-9, 0, then letters)
      // But for 1-4 with Alt/Option key, use them for tab navigation
      if (e.altKey && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        const tabIndex = parseInt(e.key, 10) - 1;
        if (tabIndex < categoriesWithQuestions.length) {
          e.preventDefault();
          goToCategory(tabIndex);
        }
        return;
      }

      const targetIndex = getIndexFromKey(e.key);
      if (targetIndex !== null) {
        if (currentQuestion.type === 'scale') {
          // For scale, shortcut selects the scale value directly
          const scaleMin = currentQuestion.scaleMin ?? 1;
          const scaleMax = currentQuestion.scaleMax ?? 5;
          const scaleRange = scaleMax - scaleMin;
          if (targetIndex <= scaleRange) {
            e.preventDefault();
            setSelectedIndex(targetIndex);
          }
        } else if (targetIndex <= maxIndex) {
          e.preventDefault();
          setSelectedIndex(targetIndex);
          
          if (currentQuestion.type === 'multiple' && options[targetIndex]) {
            // Toggle the option for multiple choice
            const optionValue = options[targetIndex].value;
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
        }
        return;
      }

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

    if (currentQuestion.type === 'single') {
      const options = currentQuestion.options || [];
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

    // Save locally (instant, no network call)
    saveAnswer(currentQuestion.slug, answer);
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndexInCategory < questionsInCurrentCategory.length - 1) {
      // More questions in current category
      setCurrentQuestionIndexInCategory(prev => prev + 1);
    } else if (currentCategoryIndex < categoriesWithQuestions.length - 1) {
      // Move to next category
      setCurrentCategoryIndex(prev => prev + 1);
      setCurrentQuestionIndexInCategory(0);
    } else {
      // All done, go to recap
      setPhase('recap');
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndexInCategory > 0) {
      // Previous question in current category
      setCurrentQuestionIndexInCategory(prev => prev - 1);
    } else if (currentCategoryIndex > 0) {
      // Move to previous category, last question
      const prevCategoryIndex = currentCategoryIndex - 1;
      const prevCategory = categoriesWithQuestions[prevCategoryIndex];
      setCurrentCategoryIndex(prevCategoryIndex);
      setCurrentQuestionIndexInCategory(prevCategory.questions.length - 1);
    }
  };

  const goToQuestion = (index: number) => {
    // Find which category this global index belongs to
    let questionCount = 0;
    for (let catIdx = 0; catIdx < categoriesWithQuestions.length; catIdx++) {
      const category = categoriesWithQuestions[catIdx];
      if (index < questionCount + category.questions.length) {
        setCurrentCategoryIndex(catIdx);
        setCurrentQuestionIndexInCategory(index - questionCount);
        setPhase('questions');
        return;
      }
      questionCount += category.questions.length;
    }
  };

  const goToCategory = (categoryIndex: number) => {
    if (categoryIndex >= 0 && categoryIndex < categoriesWithQuestions.length) {
      setCurrentCategoryIndex(categoryIndex);
      setCurrentQuestionIndexInCategory(0);
      setPhase('questions');
    }
  };

  const goToNextCategory = () => {
    if (currentCategoryIndex < categoriesWithQuestions.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
      setCurrentQuestionIndexInCategory(0);
    }
  };

  const goToPreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
      setCurrentQuestionIndexInCategory(0);
    }
  };

  const handleComplete = async () => {
    try {
      await submitAllAnswers();
      setPhase('complete');
    } catch {
      // Error is handled in the hook
    }
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
          <div className="terminal-title">loading...</div>
          <div className="terminal-status"></div>
        </div>
        <div className="terminal-body flex items-center justify-center">
          <div className="text-[#CD8B6A] font-mono animate-pulse">
            Loading survey...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !surveyData) {
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
  if (surveyData.survey.status === 'closed') {
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
              The {surveyData.survey.title} survey has ended.
            </div>
            <div className="terminal-line text-gray-400">
              Results will be published soon.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const asciiLogo = `
███████╗ ████████╗  █████╗  ████████╗ ███████╗
██╔════╝ ╚══██╔══╝ ██╔══██╗ ╚══██╔══╝ ██╔════╝
███████╗    ██║    ███████║    ██║    █████╗  
╚════██║    ██║    ██╔══██║    ██║    ██╔══╝  
███████║    ██║    ██║  ██║    ██║    ███████╗
╚══════╝    ╚═╝    ╚═╝  ╚═╝    ╚═╝    ╚══════╝
 ██████╗  ███████╗      ██████╗  ██████╗  ██████╗  ███████╗
██╔═══██╗ ██╔════╝     ██╔════╝ ██╔═══██╗ ██╔══██╗ ██╔════╝
██║   ██║ █████╗       ██║      ██║   ██║ ██║  ██║ █████╗  
██║   ██║ ██╔══╝       ██║      ██║   ██║ ██║  ██║ ██╔══╝  
╚██████╔╝ ██║          ╚██████╗ ╚██████╔╝ ██████╔╝ ███████╗
 ╚═════╝  ╚═╝           ╚═════╝  ╚═════╝  ╚═════╝  ╚══════╝`.trim();

  const renderIntro = () => (
    <div className="terminal-content">
      {/* ASCII Art Logo */}
      <div className="overflow-x-auto mb-8">
        <pre 
          className="font-mono text-[0.6rem] sm:text-[0.8rem] md:text-[0.95rem] lg:text-base leading-none whitespace-pre text-[#CD8B6A] select-none drop-shadow-[0_0_10px_rgba(205,139,106,0.5)]"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace', lineHeight: 1 }}
          aria-label="State of Code"
        >
          {asciiLogo}
        </pre>
      </div>

      <div className="terminal-line terminal-prompt">
        <span className="text-[#CD8B6A]">~</span> Welcome to {surveyData.survey.title}
      </div>
      <div className="terminal-line mt-4 text-gray-400">
        {surveyData.survey.description || 'This survey explores how developers use AI coding agents.'}
      </div>
      <div className="terminal-line text-gray-400">
        Your responses will help shape the future of developer tools.
      </div>
      <div className="terminal-line mt-6 text-gray-500">
        <span className="text-[#CD8B6A]">ℹ</span> Estimated time: 5-10 minutes
      </div>
      <div className="terminal-line text-gray-500">
        <span className="text-[#CD8B6A]">ℹ</span> {totalQuestions} questions across {surveyData.categories.length} categories
      </div>
      <div className="terminal-line text-gray-500">
        <span className="text-[#CD8B6A]">ℹ</span> All questions can be skipped
      </div>
      <div className="terminal-line mt-8">
        <span className="terminal-cursor"></span>
        <span className="text-[#CD8B6A] ml-2">Press ENTER to begin</span>
      </div>
    </div>
  );

  const renderQuestion = (question: Question) => {
    const options = question.options || [];

    return (
      <div className="terminal-content">
        {/* Question prompt */}
        <div className="terminal-line terminal-prompt mb-2">
          <span className="text-[#CD8B6A]">?</span> {question.prompt}
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
              className="w-full bg-[#21262d] border border-[#30363d] rounded px-4 py-3 text-gray-200 font-mono focus:outline-none focus:border-[#CD8B6A]"
              placeholder="Type your answer..."
              autoFocus
            />
          </div>
        ) : question.type === 'scale' ? (
          <div className="mt-4 space-y-1">
            {Array.from({ length: (question.scaleMax ?? 5) - (question.scaleMin ?? 1) + 1 }).map((_, idx) => {
              const value = (question.scaleMin ?? 1) + idx;
              const isSelected = selectedIndex === idx;
              const shortcutKey = getShortcutKey(idx);
              return (
                <div
                  key={idx}
                  className={`terminal-option ${isSelected ? 'terminal-option-selected' : ''}`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <span className="terminal-option-number text-gray-500 w-5 text-right mr-2 font-mono text-sm">
                    {shortcutKey ?? ''}
                  </span>
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
              const shortcutKey = getShortcutKey(idx);

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
                  <span className="terminal-option-number text-gray-500 w-5 text-right mr-2 font-mono text-sm">
                    {shortcutKey ?? ''}
                  </span>
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
          {question.type !== 'text' && (
            <span className="terminal-hint">
              <kbd>1-0,a-z</kbd> select
            </span>
          )}
          <span className="terminal-hint">
            <kbd>↑↓</kbd> navigate
          </span>
          {question.type === 'multiple' && (
            <span className="terminal-hint">
              <kbd>space</kbd> toggle
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
          <span className="terminal-hint">
            <kbd>[ ]</kbd> tabs
          </span>
        </div>
      </div>
    );
  };

  // Handle matrix answer selection
  const handleMatrixAnswer = (questionSlug: string, value: string) => {
    setMatrixAnswers(prev => ({ ...prev, [questionSlug]: value }));
    saveAnswer(questionSlug, value);
  };

  // Handle other text input
  const handleOtherInput = (questionSlug: string, value: string) => {
    setOtherInputs(prev => ({ ...prev, [questionSlug]: value }));
  };

  // Save other text input on blur
  const handleOtherBlur = (questionSlug: string) => {
    const value = otherInputs[questionSlug];
    if (value?.trim()) {
      saveAnswer(questionSlug, value.trim());
    }
  };

  // Submit all matrix answers and go to next category
  const handleMatrixComplete = () => {
    // Save any pending other inputs
    Object.entries(otherInputs).forEach(([slug, value]) => {
      if (value?.trim()) {
        saveAnswer(slug, value.trim());
      }
    });
    
    // Move to next category or recap
    if (currentCategoryIndex < categoriesWithQuestions.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
      setCurrentQuestionIndexInCategory(0);
    } else {
      setPhase('recap');
    }
  };

  // Render AI Tools matrix view - clean minimal style
  const renderAIToolsMatrix = () => {
    if (!aiToolsGroups || !('groups' in aiToolsGroups)) return null;
    
    const { groups } = aiToolsGroups;
    const optionLabels = ['Never', 'Heard', 'Used'];
    const optionValues = ['never-heard', 'heard', 'used'];

    return (
      <div className="terminal-content">
        <div className="terminal-line terminal-prompt mb-6">
          <span className="text-[#CD8B6A]">?</span> Rate your experience with these AI coding tools
        </div>

        <div className="matrix-clean-container max-h-[55vh] overflow-y-auto font-mono text-sm pr-2">
          {groups.map((group, groupIdx) => {
            const isCurrentGroup = groupIdx === matrixGroupIndex && !isInOverallSection;
            
            return (
              <div key={group.id} className="mb-10">
                {/* Group title */}
                <div className={`mb-2 text-sm font-medium ${isCurrentGroup ? 'text-[#CD8B6A]' : 'text-gray-500'}`}>
                  {group.title}
                </div>

                {/* Column headers */}
                <div className="flex items-center mb-3">
                  <span className="w-52"></span>
                  <div className="flex items-center">
                    {optionLabels.map((label, idx) => (
                      <span key={idx} className="w-24 text-center text-gray-500 text-xs">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tool rows */}
                <div className="space-y-3">
                  {group.questions.map((q, rowIdx) => {
                    const currentValue = matrixAnswers[q.slug] || getAnswer(q.slug);
                    const isCurrentRow = isCurrentGroup && rowIdx === matrixRowIndex;
                    
                    return (
                      <div 
                        key={q.id} 
                        className={`flex items-center ${isCurrentRow ? 'text-[#CD8B6A]' : 'text-gray-300'}`}
                      >
                        {/* Row indicator and tool name */}
                        <span className="w-52 flex items-center">
                          <span className="w-4 text-[#CD8B6A]">{isCurrentRow ? '›' : ' '}</span>
                          <span>{q.prompt}</span>
                        </span>
                        
                        {/* Radio buttons */}
                        <div className="flex items-center">
                          {optionValues.map((value, colIdx) => {
                            const isSelected = currentValue === value;
                            const isFocused = isCurrentRow && colIdx === matrixColIndex;
                            
                            return (
                              <span 
                                key={value}
                                className="w-24 text-center cursor-pointer"
                                onClick={() => {
                                  setMatrixGroupIndex(groupIdx);
                                  setMatrixRowIndex(rowIdx);
                                  setMatrixColIndex(colIdx);
                                  handleMatrixAnswer(q.slug, value);
                                }}
                              >
                                <span className={isFocused || isSelected ? 'text-[#CD8B6A]' : 'text-gray-600'}>
                                  {isSelected ? '(●)' : '( )'}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Other input */}
                {group.otherQuestion && (
                  <div className="mt-4 flex items-center gap-2 text-gray-500">
                    <span className="w-4"></span>
                    <span>Other:</span>
                    <input
                      type="text"
                      value={otherInputs[group.otherQuestion.slug] || ''}
                      onChange={(e) => handleOtherInput(group.otherQuestion!.slug, e.target.value)}
                      onBlur={() => handleOtherBlur(group.otherQuestion!.slug)}
                      onFocus={() => {
                        setMatrixGroupIndex(groupIdx);
                        setIsInOtherInput(true);
                      }}
                      className="flex-1 max-w-xs bg-transparent border-b border-gray-700 text-gray-200 font-mono text-sm focus:outline-none focus:border-[#CD8B6A] py-1"
                      placeholder="________________"
                    />
                  </div>
                )}

                {/* Satisfaction for this group */}
                {group.satisfactionQuestion && (
                  <div className="mt-6 pt-4 border-t border-gray-700/50">
                    <div className="text-gray-300 mb-2 flex items-center">
                      <span className="w-4"></span>
                      <span>{group.satisfactionQuestion.prompt}</span>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      {Array.from({ length: (group.satisfactionQuestion.scaleMax ?? 5) - (group.satisfactionQuestion.scaleMin ?? 1) + 1 }).map((_, scaleIdx) => {
                        const value = (group.satisfactionQuestion!.scaleMin ?? 1) + scaleIdx;
                        const currentValue = matrixAnswers[group.satisfactionQuestion!.slug] || getAnswer(group.satisfactionQuestion!.slug);
                        const isSelected = currentValue === value || currentValue === value.toString();
                        return (
                          <span
                            key={scaleIdx}
                            className={`cursor-pointer ${isSelected ? 'text-[#CD8B6A]' : 'text-gray-600'}`}
                            onClick={() => handleMatrixAnswer(group.satisfactionQuestion!.slug, value.toString())}
                          >
                            {isSelected ? `(${value})` : ` ${value} `}
                          </span>
                        );
                      })}
                      <span className="text-gray-600 text-xs">
                        {group.satisfactionQuestion.scaleMinLabel} → {group.satisfactionQuestion.scaleMaxLabel}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pain points for this group */}
                {group.painPointsQuestion && (
                  <div className="mt-4">
                    <div className="text-gray-300 mb-2 flex items-center">
                      <span className="w-4"></span>
                      <span>{group.painPointsQuestion.prompt}</span>
                    </div>
                    <div className="ml-4">
                      <textarea
                        value={otherInputs[group.painPointsQuestion.slug] || ''}
                        onChange={(e) => handleOtherInput(group.painPointsQuestion!.slug, e.target.value)}
                        onBlur={() => handleOtherBlur(group.painPointsQuestion!.slug)}
                        className="w-full max-w-lg bg-[#21262d] border border-[#30363d] px-3 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:border-[#CD8B6A] min-h-[60px]"
                        placeholder="Type here..."
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* Keyboard hints */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="terminal-hints flex-wrap">
            <span className="terminal-hint"><kbd>↑↓</kbd> tools</span>
            <span className="terminal-hint"><kbd>←→</kbd> options</span>
            <span className="terminal-hint"><kbd>space</kbd> select</span>
            <span className="terminal-hint"><kbd>enter</kbd> continue</span>
            <span className="terminal-hint"><kbd>s</kbd> skip group</span>
            <span className="terminal-hint"><kbd>[ ]</kbd> tabs</span>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleMatrixComplete}
              className="px-4 py-1 text-[#CD8B6A] font-mono text-sm hover:underline"
            >
              [Continue →]
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRecap = () => (
    <div className="terminal-content">
      <div className="terminal-line terminal-prompt mb-4">
        <span className="text-[#CD8B6A]">📋</span> Review Your Answers
      </div>

      <div className="space-y-6 max-h-72 overflow-y-auto pr-2">
        {surveyData.categories.map(category => {
          const categoryQuestions = category.questions.filter(shouldShowQuestion);
          if (categoryQuestions.length === 0) return null;

          return (
            <div key={category.id}>
              <div className="text-[#CD8B6A] font-mono text-sm mb-2">
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
                          <div className="text-[#CD8B6A] text-xs mt-1">
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

      {/* Email subscription */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        {!emailSubmitted ? (
          <div>
            <div className="text-gray-300 text-sm mb-2">
              Want to be notified when results are published?
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-[#21262d] border border-[#30363d] rounded px-3 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:border-[#CD8B6A]"
                placeholder="your@email.com (optional)"
              />
              <button
                onClick={handleEmailSubmit}
                disabled={!email.trim()}
                className="px-3 py-2 bg-[#CD8B6A]/20 border border-[#CD8B6A]/40 rounded text-[#CD8B6A] font-mono text-sm hover:bg-[#CD8B6A]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Subscribe
              </button>
            </div>
          </div>
        ) : (
          <div className="text-[#7ee787] text-sm">
            <span>✓</span> You&apos;ll be notified when results are ready!
          </div>
        )}
      </div>

      {/* Submit section */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="text-gray-400 text-sm mb-4">
          You answered {answeredCount} of {totalQuestions} questions
        </div>
        {isSubmitting ? (
          <div className="terminal-line">
            <span className="text-yellow-400 animate-pulse">⏳ Submitting your answers...</span>
          </div>
        ) : (
          <div className="terminal-line">
            <span className="text-[#CD8B6A]">Press ENTER to submit survey</span>
          </div>
        )}
        {error && (
          <div className="terminal-line mt-2">
            <span className="text-red-400">✗ {error}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="terminal-content">
      <div className="terminal-line terminal-prompt">
        <span className="text-[#7ee787]">✓</span> Survey Complete!
      </div>
      <div className="terminal-line mt-4 text-gray-400">
        Thank you for participating in the {surveyData.survey.title}.
      </div>
      <div className="terminal-line mt-2 text-gray-400">
        You answered {answeredCount} out of {totalQuestions} questions.
      </div>

      {emailSubmitted && (
        <div className="mt-6 text-[#7ee787]">
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
          stateofcode.ai/2025
        </div>
        <div className="terminal-status">
          {phase === 'questions' && (
            <span className="text-[#CD8B6A] text-xs font-mono">
              {progressPercentage}%
            </span>
          )}
          {phase === 'recap' && isSubmitting && (
            <span className="text-yellow-400 text-xs font-mono animate-pulse">
              submitting...
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      {phase === 'questions' && categoriesWithQuestions.length > 0 && (
        <div className="terminal-tabs">
          <div className="terminal-tabs-list">
            {categoriesWithQuestions.map((category, idx) => (
              <button
                key={category.id}
                onClick={() => goToCategory(idx)}
                className={`terminal-tab ${idx === currentCategoryIndex ? 'terminal-tab-active' : ''}`}
              >
                <span className="terminal-tab-label">
                  {category.name}
                  {category.isComplete && (
                    <span className="terminal-tab-check"> ✓</span>
                  )}
                </span>
                {idx === currentCategoryIndex && (
                  <span className="terminal-tab-underline"></span>
                )}
              </button>
            ))}
          </div>
          <div className="terminal-tabs-hint">
            <span className="text-gray-600 text-xs font-mono">
              <kbd className="terminal-kbd">⌥1-{categoriesWithQuestions.length}</kbd> jump · <kbd className="terminal-kbd">[</kbd><kbd className="terminal-kbd">]</kbd> prev/next
            </span>
          </div>
        </div>
      )}

      {/* Question progress within category */}
      {phase === 'questions' && currentCategory && (
        <div className="terminal-section-bar">
          <div className="terminal-section-info">
            {currentCategory.description && (
              <span className="text-gray-400 text-sm">{currentCategory.description}</span>
            )}
          </div>
          <div className="terminal-progress-info">
            <span className="text-gray-500 text-sm">
              {currentQuestionIndexInCategory + 1} of {questionsInCurrentCategory.length} in section · {currentQuestionIndex + 1}/{totalQuestions} total
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
        {phase === 'questions' && isAIToolsCategory && renderAIToolsMatrix()}
        {phase === 'questions' && !isAIToolsCategory && currentQuestion && renderQuestion(currentQuestion)}
        {phase === 'recap' && renderRecap()}
        {phase === 'complete' && renderComplete()}
      </div>

      {/* Terminal footer */}
      <div className="terminal-footer">
        <span className="text-gray-600 text-xs font-mono">
          stateofcode.ai · {year}
        </span>
      </div>
    </div>
  );
}
