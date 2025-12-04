import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { categories, questions, surveyQuestions, surveys } from './schema';

// Load environment variables from .env.local
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function migrateAIModels() {
  console.log('🔄 Adding AI Models section...');

  // Get the 2025 survey
  const survey2025 = await db.query.surveys.findFirst({
    where: eq(surveys.year, 2025),
  });
  
  if (!survey2025) {
    throw new Error('Survey 2025 not found.');
  }
  console.log(`Found survey: ${survey2025.title} (ID: ${survey2025.id})`);

  // Get the AI Coding Tools category
  const aiToolsCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, 'ai-tools'),
  });

  if (!aiToolsCategory) {
    throw new Error('AI Coding Tools category not found.');
  }
  console.log(`Found category: ${aiToolsCategory.name} (ID: ${aiToolsCategory.id})`);

  // Get the current max order in the category
  const existingQuestions = await db.query.questions.findMany({
    where: eq(questions.categoryId, aiToolsCategory.id),
  });
  const maxOrder = Math.max(...existingQuestions.map(q => q.order), -1);
  console.log(`Current max order: ${maxOrder}`);

  // AI Models questions to add
  const awareOpts = [
    { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
    { id: 'heard', label: 'Heard of it', value: 'heard' },
    { id: 'used', label: 'Used it', value: 'used' },
  ];

  const aiModelsQuestions = [
    // Model awareness
    { slug: 'model-gpt-4o', prompt: 'GPT-4o', description: 'OpenAI\'s flagship multimodal model', type: 'single', options: awareOpts },
    { slug: 'model-claude-sonnet', prompt: 'Claude 3.5 Sonnet', description: 'Anthropic\'s balanced performance model', type: 'single', options: awareOpts },
    { slug: 'model-o1', prompt: 'o1 / o1-preview', description: 'OpenAI\'s reasoning model', type: 'single', options: awareOpts },
    { slug: 'model-gemini-pro', prompt: 'Gemini 1.5/2.0 Pro', description: 'Google\'s advanced model', type: 'single', options: awareOpts },
    { slug: 'model-deepseek', prompt: 'DeepSeek Coder', description: 'Open-source coding model', type: 'single', options: awareOpts },
    { slug: 'model-llama', prompt: 'Llama / CodeLlama', description: 'Meta\'s open-source models', type: 'single', options: awareOpts },
    { slug: 'model-other', prompt: 'Other AI Models', description: 'Other AI models you use for coding', type: 'text' },
    // Satisfaction
    { slug: 'model-satisfaction', prompt: 'How happy are you with AI models for coding?', type: 'scale', scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Very Unhappy', scaleMaxLabel: 'Very Happy' },
    // Pain points
    { slug: 'model-pain-points', prompt: 'What pain points have you encountered with AI models?', description: 'Share any frustrations or challenges', type: 'text' },
  ];

  console.log(`Adding ${aiModelsQuestions.length} AI Models questions...`);

  for (let i = 0; i < aiModelsQuestions.length; i++) {
    const q = aiModelsQuestions[i];
    const order = maxOrder + 1 + i;

    // Check if question already exists
    const existing = await db.query.questions.findFirst({
      where: eq(questions.slug, q.slug),
    });

    if (existing) {
      console.log(`  Question ${q.slug} already exists, skipping...`);
      continue;
    }

    const [insertedQuestion] = await db.insert(questions).values({
      slug: q.slug,
      prompt: q.prompt,
      description: q.description,
      type: q.type as 'single' | 'multiple' | 'scale' | 'text',
      options: q.options,
      categoryId: aiToolsCategory.id,
      order: order,
      scaleMin: q.scaleMin,
      scaleMax: q.scaleMax,
      scaleMinLabel: q.scaleMinLabel,
      scaleMaxLabel: q.scaleMaxLabel,
    }).returning();

    // Link question to survey
    await db.insert(surveyQuestions).values({
      surveyId: survey2025.id,
      questionId: insertedQuestion.id,
      required: false,
    });

    console.log(`  ✓ Added ${q.slug} (order: ${order})`);
  }

  console.log('✅ AI Models section added!');
  process.exit(0);
}

migrateAIModels().catch(console.error);


