import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, inArray } from 'drizzle-orm';
import * as schema from './schema';
import { categories, questions, surveyQuestions, responses, surveys } from './schema';

// Load environment variables from .env.local
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function migrateAISections() {
  console.log('🔄 Migrating AI tool sections...');

  // Get the 2025 survey to link questions to
  const survey2025 = await db.query.surveys.findFirst({
    where: eq(surveys.year, 2025),
  });
  
  if (!survey2025) {
    throw new Error('Survey 2025 not found. Please seed the database first.');
  }
  console.log(`Found survey: ${survey2025.title} (ID: ${survey2025.id})`);

  // First, delete the old ai-tools category questions
  const oldAIToolsCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, 'ai-tools'),
  });

  if (oldAIToolsCategory) {
    console.log('Found old ai-tools category, removing questions...');
    
    const oldQuestions = await db.query.questions.findMany({
      where: eq(questions.categoryId, oldAIToolsCategory.id),
    });
    
    if (oldQuestions.length > 0) {
      const oldQuestionIds = oldQuestions.map(q => q.id);
      
      // Delete responses
      await db.delete(responses).where(inArray(responses.questionId, oldQuestionIds));
      console.log('✓ Removed responses');
      
      // Delete survey_questions links
      await db.delete(surveyQuestions).where(inArray(surveyQuestions.questionId, oldQuestionIds));
      console.log('✓ Removed survey_questions links');
      
      // Delete questions
      await db.delete(questions).where(inArray(questions.id, oldQuestionIds));
      console.log('✓ Removed old ai-tools questions');
    }

    // Delete the old category
    await db.delete(categories).where(eq(categories.id, oldAIToolsCategory.id));
    console.log('✓ Removed old ai-tools category');
  }

  // Create the new categories
  const newCategories = [
    { slug: 'ai_ides', name: 'AI IDEs', description: 'AI-native integrated development environments', order: 2 },
    { slug: 'extensions', name: 'Extensions', description: 'AI coding extensions for existing editors', order: 3 },
    { slug: 'autonomous_agents', name: 'Autonomous Agents', description: 'AI agents that can write code autonomously', order: 4 },
    { slug: 'app_builders', name: 'App Builders', description: 'AI tools that generate full applications', order: 5 },
  ];

  for (const cat of newCategories) {
    // Check if category already exists
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, cat.slug),
    });

    if (existing) {
      console.log(`Category ${cat.slug} already exists, checking if questions are linked...`);
      
      // Get existing questions for this category
      const existingQuestions = await db.query.questions.findMany({
        where: eq(questions.categoryId, existing.id),
      });
      
      // Check if they're linked to the survey
      for (const q of existingQuestions) {
        const linked = await db.query.surveyQuestions.findFirst({
          where: eq(surveyQuestions.questionId, q.id),
        });
        
        if (!linked) {
          await db.insert(surveyQuestions).values({
            surveyId: survey2025.id,
            questionId: q.id,
            required: false,
          });
          console.log(`  Linked question ${q.slug} to survey`);
        }
      }
      continue;
    }

    const [newCategory] = await db.insert(categories).values(cat).returning();
    console.log(`✓ Created category: ${cat.name}`);

    // Insert questions for this category
    const questionsToInsert = getQuestionsForCategory(cat.slug);
    
    for (let i = 0; i < questionsToInsert.length; i++) {
      const q = questionsToInsert[i];
      const [insertedQuestion] = await db.insert(questions).values({
        slug: q.slug,
        prompt: q.prompt,
        description: q.description,
        type: q.type as 'single' | 'multiple' | 'scale' | 'text',
        options: q.options,
        categoryId: newCategory.id,
        order: i,
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
    }
    console.log(`✓ Inserted ${questionsToInsert.length} questions for ${cat.name}`);
  }

  console.log('✅ Migration complete!');
  process.exit(0);
}

function getQuestionsForCategory(slug: string) {
  const awareOpts = [
    { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
    { id: 'heard', label: 'Heard of it', value: 'heard' },
    { id: 'used', label: 'Used it', value: 'used' },
  ];

  switch (slug) {
    case 'ai_ides':
      return [
        { slug: 'ai-ide-cursor', prompt: 'Cursor', description: 'AI-native IDE built on VS Code', type: 'single', options: awareOpts },
        { slug: 'ai-ide-windsurf', prompt: 'Windsurf', description: 'AI IDE by Codeium', type: 'single', options: awareOpts },
        { slug: 'ai-ide-zed', prompt: 'Zed', description: 'High-performance editor with AI features', type: 'single', options: awareOpts },
        { slug: 'ai-ide-antigravity', prompt: 'Antigravity', description: 'AI-native development environment', type: 'single', options: awareOpts },
        { slug: 'ai-ide-kiro', prompt: 'Kiro', description: 'AWS spec-driven AI IDE', type: 'single', options: awareOpts },
        { slug: 'ai-ide-other', prompt: 'Other AI IDEs', description: 'Other AI IDEs you use not mentioned above', type: 'text' },
        { slug: 'ai-ide-satisfaction', prompt: 'How happy are you with AI IDEs?', type: 'scale', scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Very Unhappy', scaleMaxLabel: 'Very Happy' },
        { slug: 'ai-ide-pain-points', prompt: 'What pain points have you encountered with AI IDEs?', description: 'Share any frustrations or challenges', type: 'text' },
      ];
    case 'extensions':
      return [
        { slug: 'ext-github-copilot', prompt: 'GitHub Copilot', description: 'AI pair programmer by GitHub/Microsoft', type: 'single', options: awareOpts },
        { slug: 'ext-cline', prompt: 'Cline', description: 'Autonomous coding agent for VS Code', type: 'single', options: awareOpts },
        { slug: 'ext-augment-code', prompt: 'Augment Code', description: 'AI coding assistant extension', type: 'single', options: awareOpts },
        { slug: 'ext-amazon-q', prompt: 'Amazon Q Developer', description: 'AWS AI assistant (formerly CodeWhisperer)', type: 'single', options: awareOpts },
        { slug: 'ext-other', prompt: 'Other Extensions', description: 'Other AI coding extensions you use not mentioned above', type: 'text' },
        { slug: 'ext-satisfaction', prompt: 'How happy are you with AI coding extensions?', type: 'scale', scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Very Unhappy', scaleMaxLabel: 'Very Happy' },
        { slug: 'ext-pain-points', prompt: 'What pain points have you encountered with AI extensions?', description: 'Share any frustrations or challenges', type: 'text' },
      ];
    case 'autonomous_agents':
      return [
        { slug: 'agent-claude-code', prompt: 'Claude Code', description: "Anthropic's agentic coding tool", type: 'single', options: awareOpts },
        { slug: 'agent-codex', prompt: 'Codex', description: "OpenAI's coding agent", type: 'single', options: awareOpts },
        { slug: 'agent-devin', prompt: 'Devin', description: "Cognition's autonomous AI developer", type: 'single', options: awareOpts },
        { slug: 'agent-jules', prompt: 'Jules', description: "Google's async coding agent", type: 'single', options: awareOpts },
        { slug: 'agent-openhands', prompt: 'OpenHands', description: 'Open-source autonomous coding agent', type: 'single', options: awareOpts },
        { slug: 'agent-other', prompt: 'Other Autonomous Agents', description: 'Other AI coding agents you use not mentioned above', type: 'text' },
        { slug: 'agent-satisfaction', prompt: 'How happy are you with autonomous coding agents?', type: 'scale', scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Very Unhappy', scaleMaxLabel: 'Very Happy' },
        { slug: 'agent-pain-points', prompt: 'What pain points have you encountered with autonomous agents?', description: 'Share any frustrations or challenges', type: 'text' },
      ];
    case 'app_builders':
      return [
        { slug: 'builder-replit', prompt: 'Replit', description: 'AI-powered IDE and deployment platform', type: 'single', options: awareOpts },
        { slug: 'builder-lovable', prompt: 'Lovable', description: 'AI full-stack app generator', type: 'single', options: awareOpts },
        { slug: 'builder-bolt', prompt: 'Bolt.new', description: 'StackBlitz AI app builder', type: 'single', options: awareOpts },
        { slug: 'builder-v0', prompt: 'v0', description: "Vercel's AI UI component generator", type: 'single', options: awareOpts },
        { slug: 'builder-other', prompt: 'Other App Builders', description: 'Other AI app builders you use not mentioned above', type: 'text' },
        { slug: 'builder-satisfaction', prompt: 'How happy are you with AI app builders?', type: 'scale', scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Very Unhappy', scaleMaxLabel: 'Very Happy' },
        { slug: 'builder-pain-points', prompt: 'What pain points have you encountered with AI app builders?', description: 'Share any frustrations or challenges', type: 'text' },
      ];
    default:
      return [];
  }
}

migrateAISections().catch(console.error);

