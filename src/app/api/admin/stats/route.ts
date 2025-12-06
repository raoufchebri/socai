import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, responses, questions, categories } from '@/db/schema';
import { sql, count, isNotNull, desc } from 'drizzle-orm';

export async function GET() {
  try {
    // Total sessions
    const [totalSessionsResult] = await db
      .select({ count: count() })
      .from(sessions);

    // Completed sessions
    const [completedSessionsResult] = await db
      .select({ count: count() })
      .from(sessions)
      .where(isNotNull(sessions.completedAt));

    // Total responses
    const [totalResponsesResult] = await db
      .select({ count: count() })
      .from(responses);

    // Get all questions with their categories
    const questionsData = await db
      .select({
        id: questions.id,
        slug: questions.slug,
        prompt: questions.prompt,
        type: questions.type,
        options: questions.options,
        categoryId: questions.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(questions)
      .leftJoin(categories, sql`${questions.categoryId} = ${categories.id}`)
      .orderBy(categories.order, questions.order);

    // Get response counts grouped by question and answer
    const responseCounts = await db
      .select({
        questionId: responses.questionId,
        answer: responses.answer,
        count: count(),
      })
      .from(responses)
      .groupBy(responses.questionId, responses.answer);

    // Build response stats per question
    const questionStats = questionsData.map((q) => {
      const questionResponses = responseCounts.filter(
        (r) => r.questionId === q.id
      );

      const totalForQuestion = questionResponses.reduce(
        (sum, r) => sum + r.count,
        0
      );

      // For single/multiple choice, map answers to labels
      let answerBreakdown: { answer: string; label: string; count: number; percentage: number }[] = [];

      if (q.type === 'single' || q.type === 'multiple') {
        // Get all options
        const options = (q.options as { id: string; label: string; value: string }[]) || [];
        
        // For multiple choice, answers are arrays - we need to flatten them
        if (q.type === 'multiple') {
          const flattenedCounts: Record<string, number> = {};
          
          questionResponses.forEach((r) => {
            const answers = r.answer as string[];
            if (Array.isArray(answers)) {
              answers.forEach((a) => {
                flattenedCounts[a] = (flattenedCounts[a] || 0) + r.count;
              });
            }
          });

          answerBreakdown = options.map((opt) => ({
            answer: opt.value,
            label: opt.label,
            count: flattenedCounts[opt.value] || 0,
            percentage: totalForQuestion > 0 
              ? Math.round((flattenedCounts[opt.value] || 0) / totalForQuestion * 100) 
              : 0,
          }));
        } else {
          // Single choice
          answerBreakdown = options.map((opt) => {
            const responseForOption = questionResponses.find(
              (r) => r.answer === opt.value
            );
            return {
              answer: opt.value,
              label: opt.label,
              count: responseForOption?.count || 0,
              percentage: totalForQuestion > 0 
                ? Math.round((responseForOption?.count || 0) / totalForQuestion * 100) 
                : 0,
            };
          });
        }
      } else if (q.type === 'scale') {
        // For scale questions, show distribution
        answerBreakdown = questionResponses.map((r) => ({
          answer: String(r.answer),
          label: String(r.answer),
          count: r.count,
          percentage: totalForQuestion > 0 
            ? Math.round(r.count / totalForQuestion * 100) 
            : 0,
        })).sort((a, b) => Number(a.answer) - Number(b.answer));
      } else if (q.type === 'text') {
        // For text questions, just return the text responses
        answerBreakdown = questionResponses.map((r) => ({
          answer: String(r.answer),
          label: String(r.answer),
          count: r.count,
          percentage: 0,
        }));
      }

      return {
        id: q.id,
        slug: q.slug,
        prompt: q.prompt,
        type: q.type,
        category: q.categoryName || 'Unknown',
        categorySlug: q.categorySlug || 'unknown',
        totalResponses: totalForQuestion,
        answers: answerBreakdown,
      };
    });

    // Group by category
    const byCategory = questionStats.reduce((acc, q) => {
      if (!acc[q.category]) {
        acc[q.category] = [];
      }
      acc[q.category].push(q);
      return acc;
    }, {} as Record<string, typeof questionStats>);

    // Recent sessions
    const recentSessions = await db
      .select({
        id: sessions.id,
        startedAt: sessions.startedAt,
        completedAt: sessions.completedAt,
        responseCount: sql<number>`(SELECT COUNT(*) FROM responses WHERE responses.session_id = ${sessions.id})`,
      })
      .from(sessions)
      .orderBy(desc(sessions.startedAt))
      .limit(10);

    return NextResponse.json({
      summary: {
        totalSessions: totalSessionsResult.count,
        completedSessions: completedSessionsResult.count,
        completionRate: totalSessionsResult.count > 0 
          ? Math.round((completedSessionsResult.count / totalSessionsResult.count) * 100) 
          : 0,
        totalResponses: totalResponsesResult.count,
      },
      questionStats,
      byCategory,
      recentSessions,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
