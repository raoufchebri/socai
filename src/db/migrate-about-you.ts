import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, inArray } from 'drizzle-orm';
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

  // 6. Insert new "About You" questions
  console.log('Adding new "About You" questions...');
  
  const newQuestions = [
    {
      slug: 'age',
      prompt: 'How old are you?',
      description: 'Your age in years',
      type: 'single' as const,
      order: 1,
      options: [
        { id: 'under18', label: 'Under 18', value: 'under18' },
        { id: '18-24', label: '18-24 years old', value: '18-24' },
        { id: '25-34', label: '25-34 years old', value: '25-34' },
        { id: '35-44', label: '35-44 years old', value: '35-44' },
        { id: '45-54', label: '45-54 years old', value: '45-54' },
        { id: '55-64', label: '55-64 years old', value: '55-64' },
        { id: '65plus', label: '65 or older', value: '65+' },
        { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
      ],
    },
    {
      slug: 'experience',
      prompt: 'How many years of experience do you have as a developer?',
      description: 'Whether as a professional, student, hobbyist, etc.',
      type: 'single' as const,
      order: 2,
      options: [
        { id: 'less1', label: 'Less than 1 year', value: '<1' },
        { id: '1to2', label: '1-2 years', value: '1-2' },
        { id: '3to5', label: '3-5 years', value: '3-5' },
        { id: '6to10', label: '6-10 years', value: '6-10' },
        { id: '11to20', label: '11-20 years', value: '11-20' },
        { id: '20plus', label: 'More than 20 years', value: '20+' },
      ],
    },
    {
      slug: 'company-size',
      prompt: 'How many people work at your organization?',
      description: 'Including yourself',
      type: 'single' as const,
      order: 3,
      options: [
        { id: 'solo', label: 'Just me', value: 'solo' },
        { id: '2-5', label: '2-5 people', value: '2-5' },
        { id: '6-10', label: '6-10 people', value: '6-10' },
        { id: '11-20', label: '11-20 people', value: '11-20' },
        { id: '21-50', label: '21-50 people', value: '21-50' },
        { id: '51-100', label: '51-100 people', value: '51-100' },
        { id: '101-1000', label: '101-1000 people', value: '101-1000' },
        { id: '1000plus', label: 'More than 1000 people', value: '1000+' },
        { id: 'na', label: 'Not applicable', value: 'na' },
      ],
    },
    {
      slug: 'job-title',
      prompt: 'What is your current job title or role?',
      type: 'single' as const,
      order: 4,
      options: [
        { id: 'frontend', label: 'Frontend Developer', value: 'frontend' },
        { id: 'backend', label: 'Backend Developer', value: 'backend' },
        { id: 'fullstack', label: 'Full Stack Developer', value: 'fullstack' },
        { id: 'devops', label: 'DevOps / SRE / Platform Engineer', value: 'devops' },
        { id: 'mobile', label: 'Mobile Developer', value: 'mobile' },
        { id: 'data', label: 'Data Scientist / ML Engineer', value: 'data' },
        { id: 'engineering-manager', label: 'Engineering Manager', value: 'engineering-manager' },
        { id: 'tech-lead', label: 'Tech Lead / Staff Engineer', value: 'tech-lead' },
        { id: 'cto', label: 'CTO / VP Engineering', value: 'cto' },
        { id: 'student', label: 'Student', value: 'student' },
        { id: 'hobbyist', label: 'Hobbyist', value: 'hobbyist' },
        { id: 'other', label: 'Other', value: 'other' },
      ],
    },
    {
      slug: 'yearly-income',
      prompt: 'What is your yearly gross (pre-tax) income in U.S. dollars?',
      type: 'single' as const,
      order: 5,
      options: [
        { id: '0-20k', label: '$0k - $20k', value: '0-20k' },
        { id: '20-40k', label: '$20k - $40k', value: '20-40k' },
        { id: '40-60k', label: '$40k - $60k', value: '40-60k' },
        { id: '60-80k', label: '$60k - $80k', value: '60-80k' },
        { id: '80-100k', label: '$80k - $100k', value: '80-100k' },
        { id: '100-150k', label: '$100k - $150k', value: '100-150k' },
        { id: '150-200k', label: '$150k - $200k', value: '150-200k' },
        { id: '200k-plus', label: 'More than $200k', value: '200k+' },
        { id: 'na', label: 'Prefer not to say', value: 'na' },
      ],
    },
    {
      slug: 'higher-education',
      prompt: 'Do you have a higher education degree?',
      type: 'single' as const,
      order: 6,
      options: [
        { id: 'no', label: 'No', value: 'no' },
        { id: 'yes-related', label: 'Yes, in a field related to my current profession', value: 'yes-related' },
        { id: 'yes-unrelated', label: 'Yes, but in a field unrelated to my current profession', value: 'yes-unrelated' },
      ],
    },
    {
      slug: 'country',
      prompt: 'Where do you currently reside?',
      type: 'single' as const,
      order: 7,
      options: [
        { id: 'us', label: 'United States', value: 'us' },
        { id: 'uk', label: 'United Kingdom', value: 'uk' },
        { id: 'canada', label: 'Canada', value: 'canada' },
        { id: 'germany', label: 'Germany', value: 'germany' },
        { id: 'france', label: 'France', value: 'france' },
        { id: 'india', label: 'India', value: 'india' },
        { id: 'brazil', label: 'Brazil', value: 'brazil' },
        { id: 'australia', label: 'Australia', value: 'australia' },
        { id: 'netherlands', label: 'Netherlands', value: 'netherlands' },
        { id: 'spain', label: 'Spain', value: 'spain' },
        { id: 'poland', label: 'Poland', value: 'poland' },
        { id: 'japan', label: 'Japan', value: 'japan' },
        { id: 'china', label: 'China', value: 'china' },
        { id: 'other-europe', label: 'Other (Europe)', value: 'other-europe' },
        { id: 'other-asia', label: 'Other (Asia)', value: 'other-asia' },
        { id: 'other-africa', label: 'Other (Africa)', value: 'other-africa' },
        { id: 'other-latam', label: 'Other (Latin America)', value: 'other-latam' },
        { id: 'other', label: 'Other', value: 'other' },
      ],
    },
    {
      slug: 'gender',
      prompt: 'Which one of the following options describes you?',
      description: 'We collect this data to help measure and improve the survey\'s inclusivity and representativeness.',
      type: 'single' as const,
      order: 8,
      options: [
        { id: 'man', label: 'Man', value: 'man' },
        { id: 'woman', label: 'Woman', value: 'woman' },
        { id: 'non-binary', label: 'Non-Binary or Gender Non-Conforming', value: 'non-binary' },
        { id: 'not-listed', label: 'Not Listed', value: 'not-listed' },
        { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
      ],
    },
    {
      slug: 'ethnicity',
      prompt: 'Which of the following options describe you?',
      description: 'We collect this data to help measure and improve the survey\'s inclusivity and representativeness. Select all that apply.',
      type: 'multiple' as const,
      order: 9,
      options: [
        { id: 'black', label: 'Black or of African descent', value: 'black' },
        { id: 'east-asian', label: 'East Asian', value: 'east-asian' },
        { id: 'hispanic', label: 'Hispanic or Latin', value: 'hispanic' },
        { id: 'middle-eastern', label: 'Middle Eastern', value: 'middle-eastern' },
        { id: 'multiracial', label: 'Multiracial / Multiethnic', value: 'multiracial' },
        { id: 'indigenous', label: 'Native American, Pacific Islander, or Indigenous Australian', value: 'indigenous' },
        { id: 'south-asian', label: 'South Asian', value: 'south-asian' },
        { id: 'southeast-asian', label: 'South East Asian', value: 'southeast-asian' },
        { id: 'white', label: 'White / Caucasian', value: 'white' },
        { id: 'other', label: 'Other', value: 'other' },
        { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
      ],
    },
    {
      slug: 'disability',
      prompt: 'Which of the following disabilities do you experience, if any?',
      description: 'Note that this can include temporary disabilities or injuries. Select all that apply.',
      type: 'multiple' as const,
      order: 10,
      options: [
        { id: 'visual', label: 'Visual impairments (blindness, color blindness, etc.)', value: 'visual' },
        { id: 'hearing', label: 'Hearing impairments (deafness, tinnitus, etc.)', value: 'hearing' },
        { id: 'mobility', label: 'Mobility impairments (arthritis, carpal tunnel, etc.)', value: 'mobility' },
        { id: 'neurodivergent', label: 'Neurodivergent conditions (ADHD, Autism, dyslexia, etc.)', value: 'neurodivergent' },
        { id: 'mental-health', label: 'Mental health conditions (anxiety, depression, PTSD, etc.)', value: 'mental-health' },
        { id: 'chronic-illness', label: 'Chronic illness (diabetes, autoimmune disorders, etc.)', value: 'chronic-illness' },
        { id: 'other', label: 'Other', value: 'other' },
        { id: 'none', label: 'None', value: 'none' },
        { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
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

  // 7. Link new questions to survey
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
  console.log('  3. Company size');
  console.log('  4. Job title/role');
  console.log('  5. Yearly income');
  console.log('  6. Higher education');
  console.log('  7. Country of residence');
  console.log('  8. Gender');
  console.log('  9. Ethnicity');
  console.log('  10. Disability');
}

migrateAboutYou()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });

