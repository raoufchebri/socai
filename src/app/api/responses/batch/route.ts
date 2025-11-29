import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { responses, sessions, questions, surveyQuestions } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { Answer } from '@/lib/survey-types';

// Batch upsert responses - submit all answers at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, answers } = body as { token: string; answers: Record<string, Answer> };

    if (!token || !answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'token and answers are required' },
        { status: 400 }
      );
    }

    // Find the session
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const questionSlugs = Object.keys(answers);
    
    if (questionSlugs.length === 0) {
      return NextResponse.json({
        success: true,
        savedCount: 0,
      });
    }

    // Find all questions by slug
    const allQuestions = await db.query.questions.findMany({
      where: inArray(questions.slug, questionSlugs),
    });

    const questionMap = new Map(allQuestions.map(q => [q.slug, q]));

    // Verify questions belong to the survey
    const questionIds = allQuestions.map(q => q.id);
    const validSurveyQuestions = await db.query.surveyQuestions.findMany({
      where: and(
        eq(surveyQuestions.surveyId, session.surveyId),
        inArray(surveyQuestions.questionId, questionIds)
      ),
    });

    const validQuestionIds = new Set(validSurveyQuestions.map(sq => sq.questionId));

    // Get existing responses for this session
    const existingResponses = await db.query.responses.findMany({
      where: eq(responses.sessionId, session.id),
    });

    const existingResponseMap = new Map(
      existingResponses.map(r => [r.questionId, r])
    );

    // Prepare batch operations
    const toInsert: { sessionId: number; questionId: number; answer: Answer }[] = [];
    const toUpdate: { id: number; answer: Answer }[] = [];

    for (const [slug, answer] of Object.entries(answers)) {
      const question = questionMap.get(slug);
      if (!question || !validQuestionIds.has(question.id)) {
        continue; // Skip invalid questions
      }

      const existing = existingResponseMap.get(question.id);
      if (existing) {
        toUpdate.push({ id: existing.id, answer });
      } else {
        toInsert.push({
          sessionId: session.id,
          questionId: question.id,
          answer,
        });
      }
    }

    // Execute batch insert
    if (toInsert.length > 0) {
      await db.insert(responses).values(toInsert);
    }

    // Execute batch updates (one at a time due to Drizzle limitations)
    for (const update of toUpdate) {
      await db
        .update(responses)
        .set({ answer: update.answer, answeredAt: new Date() })
        .where(eq(responses.id, update.id));
    }

    // Update session last activity
    await db
      .update(sessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(sessions.id, session.id));

    return NextResponse.json({
      success: true,
      savedCount: toInsert.length + toUpdate.length,
    });
  } catch (error) {
    console.error('Error saving batch responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

