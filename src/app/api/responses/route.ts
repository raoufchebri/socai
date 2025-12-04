import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { responses, sessions, questions, surveyQuestions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Upsert a response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, questionSlug, answer } = body;

    if (!token || !questionSlug || answer === undefined) {
      return NextResponse.json(
        { error: 'token, questionSlug, and answer are required' },
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

    // Find the question
    const question = await db.query.questions.findFirst({
      where: eq(questions.slug, questionSlug),
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Verify question belongs to the survey
    const surveyQuestion = await db.query.surveyQuestions.findFirst({
      where: and(
        eq(surveyQuestions.surveyId, session.surveyId),
        eq(surveyQuestions.questionId, question.id)
      ),
    });

    if (!surveyQuestion) {
      return NextResponse.json(
        { error: 'Question not part of this survey' },
        { status: 400 }
      );
    }

    // Check if response already exists
    const existingResponse = await db.query.responses.findFirst({
      where: and(
        eq(responses.sessionId, session.id),
        eq(responses.questionId, question.id)
      ),
    });

    let savedResponse;

    if (existingResponse) {
      // Update existing response
      [savedResponse] = await db
        .update(responses)
        .set({
          answer,
          answeredAt: new Date(),
        })
        .where(eq(responses.id, existingResponse.id))
        .returning();
    } else {
      // Create new response
      [savedResponse] = await db
        .insert(responses)
        .values({
          sessionId: session.id,
          questionId: question.id,
          answer,
        })
        .returning();
    }

    // Update session last activity
    await db
      .update(sessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(sessions.id, session.id));

    return NextResponse.json({
      success: true,
      response: {
        questionSlug,
        answer: savedResponse.answer,
        answeredAt: savedResponse.answeredAt,
      },
    });
  } catch (error) {
    console.error('Error saving response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


