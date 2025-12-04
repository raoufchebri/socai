import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emailSubscriptions, surveys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Subscribe to email notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, surveyYear } = body;

    if (!email || !surveyYear) {
      return NextResponse.json(
        { error: 'email and surveyYear are required' },
        { status: 400 }
      );
    }

    // Email validation - more robust check
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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

    // Check if already subscribed
    const existing = await db.query.emailSubscriptions.findFirst({
      where: and(
        eq(emailSubscriptions.email, email.toLowerCase()),
        eq(emailSubscriptions.surveyId, survey.id)
      ),
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Already subscribed',
      });
    }

    // Create subscription
    await db.insert(emailSubscriptions).values({
      email: email.toLowerCase(),
      surveyId: survey.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully',
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


