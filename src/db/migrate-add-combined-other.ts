import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { categories, questions, surveys, surveyQuestions } from './schema';

// Load environment variables from .env.local
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function migrateAddCombinedOther() {
  console.log('🔄 Adding combined "Other AI tools" question...\n');

  // Get or create the ai-tools category
  let aiToolsCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, 'ai-tools'),
  });

  if (!aiToolsCategory) {
    console.log('Category "ai-tools" not found. Creating it...');
    const [newCategory] = await db.insert(categories).values({
      slug: 'ai-tools',
      name: 'AI Coding Tools',
      description: 'Tell us about your experience with AI coding tools',
      order: 2,
    }).returning();
    aiToolsCategory = newCategory;
    console.log('✓ Created AI Coding Tools category');
  }

  // Get the 2025 survey
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.year, 2025),
  });

  if (!survey) {
    throw new Error('Survey for 2025 not found.');
  }

  // Check if question already exists
  const existingQuestion = await db.query.questions.findFirst({
    where: eq(questions.slug, 'ai-tools-other'),
  });

  if (existingQuestion) {
    console.log('Question "ai-tools-other" already exists. Skipping...');
    return;
  }

  // Add the combined "Other tools" question
  const [created] = await db.insert(questions).values({
    slug: 'ai-tools-other',
    prompt: 'Other AI coding tools you use',
    description: 'List any other AI coding tools not mentioned above (IDEs, extensions, agents, app builders, etc.)',
    type: 'text',
    categoryId: aiToolsCategory.id,
    order: 100, // Put at the end
  }).returning();

  console.log(`✓ Created question: ${created.slug}`);

  // Link to survey
  await db.insert(surveyQuestions).values({
    surveyId: survey.id,
    questionId: created.id,
    required: false,
  });

  console.log('✓ Linked question to survey\n');
  console.log('✅ Migration complete!');
}

migrateAddCombinedOther()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
