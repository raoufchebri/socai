import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Mark session as complete
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'token is required' },
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

    // Check if already completed - prevent re-submission
    if (session.completedAt) {
      return NextResponse.json(
        { error: 'Survey already submitted', alreadyCompleted: true },
        { status: 400 }
      );
    }

    // Mark as complete
    const [updatedSession] = await db
      .update(sessions)
      .set({
        completedAt: new Date(),
        lastActivityAt: new Date(),
      })
      .where(eq(sessions.id, session.id))
      .returning();

    return NextResponse.json({
      success: true,
      completedAt: updatedSession.completedAt,
    });
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


