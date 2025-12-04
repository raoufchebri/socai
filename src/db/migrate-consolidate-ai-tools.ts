import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { categories, questions, surveys } from './schema';

// Load environment variables from .env.local
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function migrateConsolidateAITools() {
  console.log('🔄 Consolidating AI tool sections into single category...');

  // Get the 2025 survey
  const survey2025 = await db.query.surveys.findFirst({
    where: eq(surveys.year, 2025),
  });
  
  if (!survey2025) {
    throw new Error('Survey 2025 not found.');
  }
  console.log(`Found survey: ${survey2025.title} (ID: ${survey2025.id})`);

  // Check if ai-tools category already exists
  let aiToolsCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, 'ai-tools'),
  });

  if (!aiToolsCategory) {
    // Create the consolidated AI Tools category
    const [newCategory] = await db.insert(categories).values({
      slug: 'ai-tools',
      name: 'AI Coding Tools',
      description: 'Tell us about your experience with AI coding tools',
      order: 2,
    }).returning();
    aiToolsCategory = newCategory;
    console.log('✓ Created AI Coding Tools category');
  } else {
    console.log('AI Coding Tools category already exists');
  }

  // Categories to merge into ai-tools
  const categoriesToMerge = ['ai_ides', 'extensions', 'autonomous_agents', 'app_builders'];
  
  for (const slug of categoriesToMerge) {
    const oldCategory = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!oldCategory) {
      console.log(`Category ${slug} not found, skipping...`);
      continue;
    }

    // Get questions from this category
    const oldQuestions = await db.query.questions.findMany({
      where: eq(questions.categoryId, oldCategory.id),
    });

    console.log(`Moving ${oldQuestions.length} questions from ${slug} to ai-tools...`);

    // Update each question to belong to ai-tools category
    for (const q of oldQuestions) {
      await db.update(questions)
        .set({ categoryId: aiToolsCategory.id })
        .where(eq(questions.id, q.id));
    }

    // Delete the old category
    await db.delete(categories).where(eq(categories.id, oldCategory.id));
    console.log(`✓ Merged ${slug} and deleted old category`);
  }

  // Reorder questions within ai-tools category to group them properly
  // Order: AI IDEs (0-7), Extensions (8-14), Autonomous Agents (15-22), App Builders (23-29)
  const questionOrder = [
    // AI IDEs
    'ai-ide-cursor', 'ai-ide-windsurf', 'ai-ide-zed', 'ai-ide-antigravity', 'ai-ide-kiro',
    'ai-ide-other', 'ai-ide-satisfaction', 'ai-ide-pain-points',
    // Extensions
    'ext-github-copilot', 'ext-cline', 'ext-augment-code', 'ext-amazon-q',
    'ext-other', 'ext-satisfaction', 'ext-pain-points',
    // Autonomous Agents
    'agent-claude-code', 'agent-codex', 'agent-devin', 'agent-jules', 'agent-openhands',
    'agent-other', 'agent-satisfaction', 'agent-pain-points',
    // App Builders
    'builder-replit', 'builder-lovable', 'builder-bolt', 'builder-v0',
    'builder-other', 'builder-satisfaction', 'builder-pain-points',
  ];

  console.log('Reordering questions...');
  for (let i = 0; i < questionOrder.length; i++) {
    const slug = questionOrder[i];
    await db.update(questions)
      .set({ order: i })
      .where(eq(questions.slug, slug));
  }
  console.log('✓ Questions reordered');

  console.log('✅ Migration complete!');
  process.exit(0);
}

migrateConsolidateAITools().catch(console.error);


