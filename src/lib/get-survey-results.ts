import { db } from '@/db';
import { surveys, surveyQuestions, questions, categories, responses, sessions } from '@/db/schema';
import { eq, and, asc, isNotNull, sql } from 'drizzle-orm';

export interface AnswerBreakdown {
  value: string;
  label: string;
  count: number;
  percentage: number;
}

// For multiple-choice correlation analysis
export interface SelectionDistribution {
  count: number; // number of selections (1, 2, 3, etc.)
  respondents: number;
  percentage: number;
}

export interface ToolCombination {
  tools: [string, string]; // pair of tool values
  labels: [string, string]; // pair of tool labels
  count: number;
  percentage: number; // percentage of respondents who selected both
}

export interface MultipleChoiceAnalysis {
  avgSelections: number;
  selectionDistribution: SelectionDistribution[];
  topCombinations: ToolCombination[];
}

export interface QuestionResult {
  id: number;
  slug: string;
  prompt: string;
  description: string | null;
  type: 'single' | 'multiple' | 'scale';
  totalResponses: number;
  answers: AnswerBreakdown[];
  // For scale questions
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string | null;
  scaleMaxLabel?: string | null;
  // For multiple-choice questions
  multipleChoiceAnalysis?: MultipleChoiceAnalysis;
}

export interface CategoryResult {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  questions: QuestionResult[];
}

// Cross-question correlation analysis
export interface ToolByLanguage {
  tool: string;
  toolLabel: string;
  count: number;
  percentage: number;
}

export interface LanguageToolCorrelation {
  language: string;
  languageLabel: string;
  totalUsers: number;
  topTools: ToolByLanguage[];
}

export interface CrossQuestionAnalysis {
  languageToTools: LanguageToolCorrelation[];
}

export interface SurveyResults {
  survey: {
    id: number;
    year: number;
    title: string;
    description: string | null;
    status: string;
  };
  summary: {
    totalRespondents: number;
    completedSessions: number;
  };
  categories: CategoryResult[];
  crossAnalysis?: CrossQuestionAnalysis;
}

export async function getSurveyResults(year: number): Promise<SurveyResults | null> {
  // Get survey by year
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.year, year),
  });

  if (!survey) {
    return null;
  }

  // Get completed sessions count
  const sessionsData = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(case when ${sessions.completedAt} is not null then 1 end)::int`,
    })
    .from(sessions)
    .where(eq(sessions.surveyId, survey.id));

  const totalRespondents = sessionsData[0]?.total ?? 0;
  const completedSessions = sessionsData[0]?.completed ?? 0;

  // Get all active questions for this survey (excluding text type)
  const surveyQuestionsData = await db
    .select({
      question: questions,
      category: categories,
    })
    .from(surveyQuestions)
    .innerJoin(questions, eq(surveyQuestions.questionId, questions.id))
    .innerJoin(categories, eq(questions.categoryId, categories.id))
    .where(and(
      eq(surveyQuestions.surveyId, survey.id),
      eq(questions.active, true),
      sql`${questions.type} != 'text'` // Exclude text questions
    ))
    .orderBy(asc(categories.order), asc(questions.order));

  // Get all responses for completed sessions (include sessionId for cross-analysis)
  const allResponses = await db
    .select({
      sessionId: responses.sessionId,
      questionId: responses.questionId,
      answer: responses.answer,
    })
    .from(responses)
    .innerJoin(sessions, eq(responses.sessionId, sessions.id))
    .where(and(
      eq(sessions.surveyId, survey.id),
      isNotNull(sessions.completedAt)
    ));

  // Group responses by question ID
  const responsesByQuestion = new Map<number, unknown[]>();
  // Also group by session for cross-analysis
  const responsesBySession = new Map<number, Map<number, unknown>>();
  
  for (const response of allResponses) {
    // Group by question
    if (!responsesByQuestion.has(response.questionId)) {
      responsesByQuestion.set(response.questionId, []);
    }
    responsesByQuestion.get(response.questionId)!.push(response.answer);
    
    // Group by session
    if (!responsesBySession.has(response.sessionId)) {
      responsesBySession.set(response.sessionId, new Map());
    }
    responsesBySession.get(response.sessionId)!.set(response.questionId, response.answer);
  }

  // Build categories with aggregated question results
  const categoriesMap = new Map<number, CategoryResult>();

  for (const row of surveyQuestionsData) {
    const { question, category } = row;
    
    if (!categoriesMap.has(category.id)) {
      categoriesMap.set(category.id, {
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        order: category.order,
        questions: [],
      });
    }

    const questionResponses = responsesByQuestion.get(question.id) || [];
    const totalResponses = questionResponses.length;

    // Aggregate answers based on question type
    const answerCounts = new Map<string, number>();

    if (question.type === 'single') {
      // Single choice - count each answer
      for (const answer of questionResponses) {
        const answerStr = String(answer);
        // Handle "other:text" format - group all "other" responses together
        const normalizedAnswer = answerStr.startsWith('other:') ? 'other' : answerStr;
        answerCounts.set(normalizedAnswer, (answerCounts.get(normalizedAnswer) || 0) + 1);
      }
    } else if (question.type === 'multiple') {
      // Multiple choice - count each selected option
      for (const answer of questionResponses) {
        const answers = Array.isArray(answer) ? answer : [answer];
        for (const a of answers) {
          const answerStr = String(a);
          const normalizedAnswer = answerStr.startsWith('other:') ? 'other' : answerStr;
          answerCounts.set(normalizedAnswer, (answerCounts.get(normalizedAnswer) || 0) + 1);
        }
      }
    } else if (question.type === 'scale') {
      // Scale - count each numeric value
      for (const answer of questionResponses) {
        const answerStr = String(answer);
        answerCounts.set(answerStr, (answerCounts.get(answerStr) || 0) + 1);
      }
    }

    // Convert to AnswerBreakdown array with labels
    const options = question.options as Array<{ id: string; label: string; value: string }> | null;
    const answers: AnswerBreakdown[] = [];

    if (question.type === 'scale') {
      // For scale questions, create entries for each scale value
      const min = question.scaleMin ?? 1;
      const max = question.scaleMax ?? 5;
      for (let i = min; i <= max; i++) {
        const count = answerCounts.get(String(i)) || 0;
        answers.push({
          value: String(i),
          label: String(i),
          count,
          percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        });
      }
    } else if (options) {
      // For choice questions, use options for labels
      for (const option of options) {
        const count = answerCounts.get(option.value) || 0;
        answers.push({
          value: option.value,
          label: option.label,
          count,
          percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        });
      }
    }

    // Sort by count (descending) for choice questions
    if (question.type !== 'scale') {
      answers.sort((a, b) => b.count - a.count);
    }

    const questionResult: QuestionResult = {
      id: question.id,
      slug: question.slug,
      prompt: question.prompt,
      description: question.description,
      type: question.type as 'single' | 'multiple' | 'scale',
      totalResponses,
      answers,
    };

    // Add scale-specific fields
    if (question.type === 'scale') {
      questionResult.scaleMin = question.scaleMin ?? 1;
      questionResult.scaleMax = question.scaleMax ?? 5;
      questionResult.scaleMinLabel = question.scaleMinLabel;
      questionResult.scaleMaxLabel = question.scaleMaxLabel;
    }

    // Add multiple-choice analysis (selection distribution + correlations)
    if (question.type === 'multiple' && totalResponses > 0) {
      const optionsMap = new Map<string, string>();
      if (options) {
        for (const opt of options) {
          optionsMap.set(opt.value, opt.label);
        }
      }

      // Calculate selection distribution
      const selectionCounts = new Map<number, number>();
      let totalSelections = 0;

      // Calculate combination counts
      const combinationCounts = new Map<string, number>();

      for (const answer of questionResponses) {
        const selections = Array.isArray(answer) ? answer.map(String) : [String(answer)];
        const normalizedSelections = selections.map(s => s.startsWith('other:') ? 'other' : s);
        const count = normalizedSelections.length;
        
        selectionCounts.set(count, (selectionCounts.get(count) || 0) + 1);
        totalSelections += count;

        // Count all pairs (combinations)
        if (normalizedSelections.length >= 2) {
          for (let i = 0; i < normalizedSelections.length; i++) {
            for (let j = i + 1; j < normalizedSelections.length; j++) {
              // Sort to ensure consistent key
              const pair = [normalizedSelections[i], normalizedSelections[j]].sort();
              const key = pair.join('|||');
              combinationCounts.set(key, (combinationCounts.get(key) || 0) + 1);
            }
          }
        }
      }

      // Build selection distribution array
      const selectionDistribution: SelectionDistribution[] = [];
      const maxSelections = Math.max(...Array.from(selectionCounts.keys()));
      for (let i = 1; i <= Math.min(maxSelections, 10); i++) {
        const respondents = selectionCounts.get(i) || 0;
        if (respondents > 0 || i <= 5) {
          selectionDistribution.push({
            count: i,
            respondents,
            percentage: Math.round((respondents / totalResponses) * 100),
          });
        }
      }
      // Group 10+ into one bucket if needed
      if (maxSelections > 10) {
        let respondents10Plus = 0;
        for (let i = 11; i <= maxSelections; i++) {
          respondents10Plus += selectionCounts.get(i) || 0;
        }
        if (respondents10Plus > 0) {
          selectionDistribution.push({
            count: 10,
            respondents: (selectionCounts.get(10) || 0) + respondents10Plus,
            percentage: Math.round(((selectionCounts.get(10) || 0) + respondents10Plus) / totalResponses * 100),
          });
        }
      }

      // Get top combinations
      const sortedCombinations = Array.from(combinationCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const topCombinations: ToolCombination[] = sortedCombinations.map(([key, count]) => {
        const [tool1, tool2] = key.split('|||');
        return {
          tools: [tool1, tool2] as [string, string],
          labels: [
            optionsMap.get(tool1) || tool1,
            optionsMap.get(tool2) || tool2,
          ] as [string, string],
          count,
          percentage: Math.round((count / totalResponses) * 100),
        };
      });

      questionResult.multipleChoiceAnalysis = {
        avgSelections: Math.round((totalSelections / totalResponses) * 10) / 10,
        selectionDistribution,
        topCombinations,
      };
    }

    categoriesMap.get(category.id)!.questions.push(questionResult);
  }

  const categoriesWithResults = Array.from(categoriesMap.values())
    .sort((a, b) => a.order - b.order);

  // Calculate cross-question analysis (Language → Tool correlations)
  let crossAnalysis: CrossQuestionAnalysis | undefined;
  
  // Find the programming-languages and tools-currently-use questions
  const languagesQuestion = surveyQuestionsData.find(q => q.question.slug === 'programming-languages');
  const toolsQuestion = surveyQuestionsData.find(q => q.question.slug === 'tools-currently-use');
  
  if (languagesQuestion && toolsQuestion) {
    const languageOptions = languagesQuestion.question.options as Array<{ id: string; label: string; value: string }> | null;
    const toolOptions = toolsQuestion.question.options as Array<{ id: string; label: string; value: string }> | null;
    
    if (languageOptions && toolOptions) {
      // Create lookup maps
      const languageLabels = new Map<string, string>();
      for (const opt of languageOptions) {
        languageLabels.set(opt.value, opt.label);
      }
      
      const toolLabels = new Map<string, string>();
      for (const opt of toolOptions) {
        toolLabels.set(opt.value, opt.label);
      }
      
      // For each language, count tool usage
      const languageToToolCounts = new Map<string, Map<string, number>>();
      const languageUserCounts = new Map<string, number>();
      
      for (const [, sessionResponses] of responsesBySession) {
        const languageAnswer = sessionResponses.get(languagesQuestion.question.id);
        const toolAnswer = sessionResponses.get(toolsQuestion.question.id);
        
        if (!languageAnswer || !toolAnswer) continue;
        
        const languages = Array.isArray(languageAnswer) 
          ? languageAnswer.map(String) 
          : [String(languageAnswer)];
        const tools = Array.isArray(toolAnswer) 
          ? toolAnswer.map(String) 
          : [String(toolAnswer)];
        
        // Normalize
        const normalizedLanguages = languages.map(l => l.startsWith('other:') ? 'other' : l);
        const normalizedTools = tools.map(t => t.startsWith('other:') ? 'other' : t);
        
        // For each language this user selected, count their tools
        for (const lang of normalizedLanguages) {
          languageUserCounts.set(lang, (languageUserCounts.get(lang) || 0) + 1);
          
          if (!languageToToolCounts.has(lang)) {
            languageToToolCounts.set(lang, new Map());
          }
          const toolCounts = languageToToolCounts.get(lang)!;
          
          for (const tool of normalizedTools) {
            toolCounts.set(tool, (toolCounts.get(tool) || 0) + 1);
          }
        }
      }
      
      // Build the correlation data - only for languages with significant users
      const languageToTools: LanguageToolCorrelation[] = [];
      
      for (const [lang, totalUsers] of languageUserCounts) {
        // Only include languages with at least 5 users
        if (totalUsers < 5) continue;
        
        const toolCounts = languageToToolCounts.get(lang);
        if (!toolCounts) continue;
        
        // Get top 5 tools for this language
        const topTools: ToolByLanguage[] = Array.from(toolCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tool, count]) => ({
            tool,
            toolLabel: toolLabels.get(tool) || tool,
            count,
            percentage: Math.round((count / totalUsers) * 100),
          }));
        
        languageToTools.push({
          language: lang,
          languageLabel: languageLabels.get(lang) || lang,
          totalUsers,
          topTools,
        });
      }
      
      // Sort by total users (most popular languages first)
      languageToTools.sort((a, b) => b.totalUsers - a.totalUsers);
      
      crossAnalysis = {
        languageToTools,
      };
    }
  }

  return {
    survey: {
      id: survey.id,
      year: survey.year,
      title: survey.title,
      description: survey.description,
      status: survey.status,
    },
    summary: {
      totalRespondents,
      completedSessions,
    },
    categories: categoriesWithResults,
    crossAnalysis,
  };
}

