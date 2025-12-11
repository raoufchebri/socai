import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { surveys, surveyQuestions, questions, categories } from '@/db/schema';
import { eq, asc, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await params;
    const yearNum = parseInt(year, 10);

    if (isNaN(yearNum)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    // Get survey by year
    const survey = await db.query.surveys.findFirst({
      where: eq(surveys.year, yearNum),
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }

    // Get all active questions for this survey with their categories
    const surveyQuestionsData = await db
      .select({
        question: questions,
        category: categories,
        required: surveyQuestions.required,
      })
      .from(surveyQuestions)
      .innerJoin(questions, eq(surveyQuestions.questionId, questions.id))
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(and(
        eq(surveyQuestions.surveyId, survey.id),
        eq(questions.active, true)
      ))
      .orderBy(asc(categories.order), asc(questions.order));

    // Group questions by category
    const categoriesMap = new Map<number, {
      id: number;
      slug: string;
      name: string;
      description: string | null;
      order: number;
      questions: typeof surveyQuestionsData[0]['question'][];
    }>();

    for (const row of surveyQuestionsData) {
      if (!categoriesMap.has(row.category.id)) {
        categoriesMap.set(row.category.id, {
          ...row.category,
          questions: [],
        });
      }
      categoriesMap.get(row.category.id)!.questions.push({
        ...row.question,
        required: row.required,
      } as typeof row.question);
    }

    const categoriesWithQuestions = Array.from(categoriesMap.values())
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({
      survey: {
        id: survey.id,
        year: survey.year,
        title: survey.title,
        description: survey.description,
        status: survey.status,
        startDate: survey.startDate,
        endDate: survey.endDate,
      },
      categories: categoriesWithQuestions,
      totalQuestions: surveyQuestionsData.length,
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




