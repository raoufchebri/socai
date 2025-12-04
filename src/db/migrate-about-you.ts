import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, inArray } from 'drizzle-orm';
import * as schema from './schema';
import { surveys, categories, questions, surveyQuestions, responses } from './schema';

// Load environment variables from .env.local
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function migrateAboutYou() {
  console.log('🔄 Migrating "About You" questions...\n');

  // 1. Find the about-you category
  const aboutYouCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, 'about-you'),
  });

  if (!aboutYouCategory) {
    throw new Error('Category "about-you" not found. Run seed first.');
  }

  // 2. Find the 2025 survey
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.year, 2025),
  });

  if (!survey) {
    throw new Error('Survey for 2025 not found. Run seed first.');
  }

  // 3. Get existing about-you questions
  const existingQuestions = await db.query.questions.findMany({
    where: eq(questions.categoryId, aboutYouCategory.id),
  });

  const existingQuestionIds = existingQuestions.map(q => q.id);

  // 4. Delete responses, survey_questions links, and questions
  if (existingQuestionIds.length > 0) {
    console.log(`Removing ${existingQuestionIds.length} existing "About You" questions...`);
    
    // First delete responses for these questions
    await db.delete(responses)
      .where(inArray(responses.questionId, existingQuestionIds));
    console.log('✓ Removed existing responses for these questions');
    
    // Then delete survey_questions links
    await db.delete(surveyQuestions)
      .where(inArray(surveyQuestions.questionId, existingQuestionIds));
    console.log('✓ Removed survey_questions links');
    
    // Finally delete the questions themselves
    await db.delete(questions)
      .where(inArray(questions.id, existingQuestionIds));
    
    console.log('✓ Removed existing questions\n');
  }

  // 5. Insert new "About You" questions
  console.log('Adding new "About You" questions...');
  
  const newQuestions = [
    {
      slug: 'age',
      prompt: 'How old are you?',
      type: 'single' as const,
      order: 1,
      options: [
        { id: 'under18', label: 'Under 18', value: 'under18' },
        { id: '18-24', label: '18–24', value: '18-24' },
        { id: '25-34', label: '25–34', value: '25-34' },
        { id: '35-44', label: '35–44', value: '35-44' },
        { id: '45-54', label: '45–54', value: '45-54' },
        { id: '55-64', label: '55–64', value: '55-64' },
        { id: '65plus', label: '65 or older', value: '65+' },
        { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
      ],
    },
    {
      slug: 'experience',
      prompt: 'How many years of experience do you have as a developer?',
      type: 'single' as const,
      order: 2,
      options: [
        { id: 'less1', label: 'Less than 1 year', value: '<1' },
        { id: '1to2', label: '1–2 years', value: '1-2' },
        { id: '3to5', label: '3–5 years', value: '3-5' },
        { id: '6to10', label: '6–10 years', value: '6-10' },
        { id: '11to15', label: '11–15 years', value: '11-15' },
        { id: '16to20', label: '16–20 years', value: '16-20' },
        { id: '20plus', label: 'More than 20 years', value: '20+' },
      ],
    },
    {
      slug: 'job-role',
      prompt: 'What is your current job title or role?',
      type: 'single' as const,
      order: 3,
      options: [
        { id: 'student', label: 'Student', value: 'student' },
        { id: 'individual-contributor', label: 'Individual contributor (developer / engineer)', value: 'individual-contributor' },
        { id: 'tech-lead', label: 'Tech lead / staff / principal engineer', value: 'tech-lead' },
        { id: 'engineering-manager', label: 'Engineering manager', value: 'engineering-manager' },
        { id: 'architect', label: 'Architect', value: 'architect' },
        { id: 'data-ml-ai', label: 'Data / ML / AI engineer', value: 'data-ml-ai' },
        { id: 'devops-sre', label: 'DevOps / SRE / Platform engineer', value: 'devops-sre' },
        { id: 'product-manager', label: 'Product manager', value: 'product-manager' },
        { id: 'other', label: 'Other (please specify)', value: 'other' },
      ],
    },
    {
      slug: 'work-location',
      prompt: 'Where do you primarily work from?',
      description: 'Select one',
      type: 'single' as const,
      order: 4,
      options: [
        { id: 'north-america', label: 'North America', value: 'north-america' },
        { id: 'latin-america', label: 'Latin America', value: 'latin-america' },
        { id: 'europe', label: 'Europe', value: 'europe' },
        { id: 'middle-east', label: 'Middle East', value: 'middle-east' },
        { id: 'africa', label: 'Africa', value: 'africa' },
        { id: 'south-asia', label: 'South Asia', value: 'south-asia' },
        { id: 'east-asia', label: 'East Asia', value: 'east-asia' },
        { id: 'southeast-asia', label: 'Southeast Asia', value: 'southeast-asia' },
        { id: 'oceania', label: 'Oceania', value: 'oceania' },
        { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
      ],
    },
    {
      slug: 'company-size',
      prompt: 'How many people work at your organization?',
      type: 'single' as const,
      order: 5,
      options: [
        { id: 'solo', label: 'Just me (freelance / solo)', value: 'solo' },
        { id: '2-10', label: '2–10', value: '2-10' },
        { id: '11-50', label: '11–50', value: '11-50' },
        { id: '51-200', label: '51–200', value: '51-200' },
        { id: '201-1000', label: '201–1,000', value: '201-1000' },
        { id: '1001-5000', label: '1,001–5,000', value: '1001-5000' },
        { id: '5000plus', label: 'More than 5,000', value: '5000+' },
        { id: 'not-sure', label: 'Not sure', value: 'not-sure' },
      ],
    },
    {
      slug: 'higher-education',
      prompt: 'Do you have a higher education degree?',
      type: 'single' as const,
      order: 6,
      options: [
        { id: 'no-degree', label: 'No formal degree', value: 'no-degree' },
        { id: 'bootcamp', label: 'Bootcamp / professional certification', value: 'bootcamp' },
        { id: 'bachelors', label: 'Bachelor\'s degree', value: 'bachelors' },
        { id: 'masters', label: 'Master\'s degree', value: 'masters' },
        { id: 'doctorate', label: 'Doctorate (PhD, etc.)', value: 'doctorate' },
        { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
      ],
    },
    {
      slug: 'employment-status',
      prompt: 'Which one of the following options describes you?',
      type: 'single' as const,
      order: 7,
      options: [
        { id: 'full-time', label: 'Full-time employee', value: 'full-time' },
        { id: 'part-time', label: 'Part-time employee', value: 'part-time' },
        { id: 'contractor', label: 'Contractor / consultant', value: 'contractor' },
        { id: 'founder', label: 'Founder / indie hacker', value: 'founder' },
        { id: 'student', label: 'Student', value: 'student' },
        { id: 'not-working', label: 'Currently not working in tech', value: 'not-working' },
      ],
    },
  ];

  const createdQuestionIds: number[] = [];

  for (const q of newQuestions) {
    const [created] = await db.insert(questions).values({
      slug: q.slug,
      prompt: q.prompt,
      description: q.description,
      type: q.type,
      options: q.options,
      categoryId: aboutYouCategory.id,
      order: q.order,
    }).returning();
    
    createdQuestionIds.push(created.id);
    console.log(`✓ Created question: ${q.slug}`);
  }

  // 6. Link new questions to survey
  console.log('\nLinking questions to survey...');
  for (const questionId of createdQuestionIds) {
    await db.insert(surveyQuestions).values({
      surveyId: survey.id,
      questionId: questionId,
      required: false,
    });
  }
  console.log(`✓ Linked ${createdQuestionIds.length} questions to survey\n`);

  console.log('✅ Migration complete!');
  console.log(`\nNew "About You" questions:`);
  console.log('  1. Age');
  console.log('  2. Years of experience');
  console.log('  3. Job role');
  console.log('  4. Work location (geographical region)');
  console.log('  5. Company size');
  console.log('  6. Higher education');
  console.log('  7. Employment status');
}

migrateAboutYou()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
