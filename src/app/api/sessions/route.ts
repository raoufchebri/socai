import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, surveys, responses, questions } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Helper to get client IP from request
function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback - this usually won't be the real IP behind a proxy
  return 'unknown';
}

// Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { surveyYear } = body;

    if (!surveyYear) {
      return NextResponse.json(
        { error: 'surveyYear is required' },
        { status: 400 }
      );
    }

    // Find the survey
    const survey = await db.query.surveys.findFirst({
      where: eq(surveys.year, surveyYear),
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }

    if (survey.status !== 'open') {
      return NextResponse.json(
        { error: 'Survey is not open' },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIP = getClientIP(request);

    // Check if there's an existing completed session from this IP
    if (clientIP !== 'unknown') {
      const existingCompletedSession = await db.query.sessions.findFirst({
        where: and(
          eq(sessions.surveyId, survey.id),
          eq(sessions.ip, clientIP),
          isNotNull(sessions.completedAt)
        ),
      });

      if (existingCompletedSession) {
        return NextResponse.json(
          { 
            error: 'You have already submitted this survey',
            alreadyCompleted: true,
          },
          { status: 403 }
        );
      }

      // Check if there's an existing non-completed session from this IP
      const existingSession = await db.query.sessions.findFirst({
        where: and(
          eq(sessions.surveyId, survey.id),
          eq(sessions.ip, clientIP)
        ),
      });

      if (existingSession) {
        // Return the existing session
        return NextResponse.json({
          token: existingSession.token,
          surveyId: existingSession.surveyId,
          startedAt: existingSession.startedAt,
          existingSession: true,
        });
      }
    }

    // Generate a unique token
    const token = randomBytes(32).toString('hex');

    // Create the session with IP
    const [session] = await db.insert(sessions).values({
      token,
      surveyId: survey.id,
      ip: clientIP !== 'unknown' ? clientIP : null,
    }).returning();

    return NextResponse.json({
      token: session.token,
      surveyId: session.surveyId,
      startedAt: session.startedAt,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get session with responses
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'token is required' },
        { status: 400 }
      );
    }

    // Find the session
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
      with: {
        survey: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get all responses for this session
    const sessionResponses = await db
      .select({
        questionId: responses.questionId,
        questionSlug: questions.slug,
        answer: responses.answer,
        answeredAt: responses.answeredAt,
      })
      .from(responses)
      .innerJoin(questions, eq(responses.questionId, questions.id))
      .where(eq(responses.sessionId, session.id));

    // Convert to a map of slug -> answer for easy lookup
    const answersMap: Record<string, unknown> = {};
    for (const response of sessionResponses) {
      answersMap[response.questionSlug] = response.answer;
    }

    return NextResponse.json({
      session: {
        token: session.token,
        surveyId: session.surveyId,
        surveyYear: session.survey.year,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      },
      answers: answersMap,
      answeredCount: sessionResponses.length,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


