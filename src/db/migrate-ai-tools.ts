import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, ne, inArray } from 'drizzle-orm';
import * as schema from './schema';
import { surveys, categories, questions, surveyQuestions, responses } from './schema';

// Load environment variables from .env.local
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function migrateAITools() {
  console.log('🔄 Migrating AI Coding Tools section...\n');

  // 1. Find the about-you category (id = 1, which we want to keep)
  const aboutYouCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, 'about-you'),
  });

  if (!aboutYouCategory) {
    throw new Error('Category "about-you" not found.');
  }

  // 2. Find the ai-tools category
  const aiToolsCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, 'ai-tools'),
  });

  if (!aiToolsCategory) {
    throw new Error('Category "ai-tools" not found.');
  }

  // 3. Find the 2025 survey
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.year, 2025),
  });

  if (!survey) {
    throw new Error('Survey for 2025 not found.');
  }

  // 4. Get all questions NOT in about-you category
  const questionsToDelete = await db.query.questions.findMany({
    where: ne(questions.categoryId, aboutYouCategory.id),
  });

  const questionIdsToDelete = questionsToDelete.map(q => q.id);

  // 5. Delete responses, survey_questions, and questions for non-about-you categories
  if (questionIdsToDelete.length > 0) {
    console.log(`Removing ${questionIdsToDelete.length} questions from categories other than "About You"...`);
    
    await db.delete(responses)
      .where(inArray(responses.questionId, questionIdsToDelete));
    console.log('✓ Removed responses');
    
    await db.delete(surveyQuestions)
      .where(inArray(surveyQuestions.questionId, questionIdsToDelete));
    console.log('✓ Removed survey_questions links');
    
    await db.delete(questions)
      .where(inArray(questions.id, questionIdsToDelete));
    console.log('✓ Removed questions\n');
  } else {
    console.log('No questions to remove from other categories.\n');
  }

  // 6. Insert new AI Coding Tools questions
  console.log('Adding new AI Coding Tools questions...\n');

  const newQuestions = [
    // === AI IDEs ===
    {
      slug: 'ai-ide-cursor',
      prompt: 'Cursor',
      description: 'AI-native IDE built on VS Code',
      type: 'single' as const,
      order: 1,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'ai-ide-windsurf',
      prompt: 'Windsurf',
      description: 'AI IDE by Codeium',
      type: 'single' as const,
      order: 2,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'ai-ide-zed',
      prompt: 'Zed',
      description: 'High-performance editor with AI features',
      type: 'single' as const,
      order: 3,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'ai-ide-antigravity',
      prompt: 'Antigravity',
      description: 'AI-native development environment',
      type: 'single' as const,
      order: 4,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'ai-ide-kiro',
      prompt: 'Kiro',
      description: 'AWS spec-driven AI IDE',
      type: 'single' as const,
      order: 5,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'ai-ide-other',
      prompt: 'Other AI IDEs',
      description: 'Other AI IDEs you use not mentioned above',
      type: 'text' as const,
      order: 6,
    },

    // === Extensions ===
    {
      slug: 'ext-github-copilot',
      prompt: 'GitHub Copilot',
      description: 'AI pair programmer by GitHub/Microsoft',
      type: 'single' as const,
      order: 7,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'ext-cline',
      prompt: 'Cline',
      description: 'Autonomous coding agent for VS Code',
      type: 'single' as const,
      order: 8,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'ext-augment-code',
      prompt: 'Augment Code',
      description: 'AI coding assistant extension',
      type: 'single' as const,
      order: 9,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'ext-amazon-q',
      prompt: 'Amazon Q Developer',
      description: 'AWS AI assistant (formerly CodeWhisperer)',
      type: 'single' as const,
      order: 10,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'ext-other',
      prompt: 'Other Extensions',
      description: 'Other AI coding extensions you use not mentioned above',
      type: 'text' as const,
      order: 11,
    },

    // === Autonomous Agents ===
    {
      slug: 'agent-claude-code',
      prompt: 'Claude Code',
      description: 'Anthropic\'s agentic coding tool',
      type: 'single' as const,
      order: 12,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'agent-codex',
      prompt: 'Codex',
      description: 'OpenAI\'s coding agent',
      type: 'single' as const,
      order: 13,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'agent-devin',
      prompt: 'Devin',
      description: 'Cognition\'s autonomous AI developer',
      type: 'single' as const,
      order: 14,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'agent-jules',
      prompt: 'Jules',
      description: 'Google\'s async coding agent',
      type: 'single' as const,
      order: 15,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'agent-openhands',
      prompt: 'OpenHands',
      description: 'Open-source autonomous coding agent',
      type: 'single' as const,
      order: 16,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'agent-other',
      prompt: 'Other Autonomous Agents',
      description: 'Other AI coding agents you use not mentioned above',
      type: 'text' as const,
      order: 17,
    },

    // === App Builders ===
    {
      slug: 'builder-replit',
      prompt: 'Replit',
      description: 'AI-powered IDE and deployment platform',
      type: 'single' as const,
      order: 18,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'builder-lovable',
      prompt: 'Lovable',
      description: 'AI full-stack app generator',
      type: 'single' as const,
      order: 19,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'builder-bolt',
      prompt: 'Bolt.new',
      description: 'StackBlitz AI app builder',
      type: 'single' as const,
      order: 20,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'builder-v0',
      prompt: 'v0',
      description: 'Vercel\'s AI UI component generator',
      type: 'single' as const,
      order: 21,
      options: [
        { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
        { id: 'heard', label: 'Heard of it', value: 'heard' },
        { id: 'used', label: 'Used it', value: 'used' },
      ],
    },
    {
      slug: 'builder-other',
      prompt: 'Other App Builders',
      description: 'Other AI app builders you use not mentioned above',
      type: 'text' as const,
      order: 22,
    },

    // === Overall Satisfaction ===
    {
      slug: 'ai-tools-satisfaction',
      prompt: 'How happy are you with the current state of AI coding tools?',
      type: 'scale' as const,
      order: 23,
      scaleMin: 1,
      scaleMax: 5,
      scaleMinLabel: 'Very Unhappy',
      scaleMaxLabel: 'Very Happy',
    },
    {
      slug: 'ai-tools-pain-points',
      prompt: 'What pain points have you encountered when using AI coding tools?',
      description: 'Share any frustrations or challenges you\'ve experienced',
      type: 'text' as const,
      order: 24,
    },
  ];

  const createdQuestionIds: number[] = [];

  // Group questions for logging
  const groups = {
    'AI IDEs': newQuestions.filter(q => q.slug.startsWith('ai-ide')),
    'Extensions': newQuestions.filter(q => q.slug.startsWith('ext-')),
    'Autonomous Agents': newQuestions.filter(q => q.slug.startsWith('agent-')),
    'App Builders': newQuestions.filter(q => q.slug.startsWith('builder-')),
    'Overall': newQuestions.filter(q => q.slug.startsWith('ai-tools-')),
  };

  for (const [groupName, groupQuestions] of Object.entries(groups)) {
    console.log(`📁 ${groupName}:`);
    for (const q of groupQuestions) {
      const [created] = await db.insert(questions).values({
        slug: q.slug,
        prompt: q.prompt,
        description: q.description,
        type: q.type,
        options: q.options,
        categoryId: aiToolsCategory.id,
        order: q.order,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
        scaleMinLabel: q.scaleMinLabel,
        scaleMaxLabel: q.scaleMaxLabel,
      }).returning();
      
      createdQuestionIds.push(created.id);
      console.log(`   ✓ ${q.prompt}`);
    }
    console.log('');
  }

  // 7. Link new questions to survey
  console.log('Linking questions to survey...');
  for (const questionId of createdQuestionIds) {
    await db.insert(surveyQuestions).values({
      surveyId: survey.id,
      questionId: questionId,
      required: false,
    });
  }
  console.log(`✓ Linked ${createdQuestionIds.length} questions to survey\n`);

  console.log('✅ Migration complete!');
  console.log(`
Summary:
  - AI IDEs: 5 tools + 1 other
  - Extensions: 4 tools + 1 other  
  - Autonomous Agents: 5 tools + 1 other
  - App Builders: 4 tools + 1 other
  - Overall: satisfaction + pain points
  
  Total: ${createdQuestionIds.length} questions added to category 2
`);
}

migrateAITools()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });





