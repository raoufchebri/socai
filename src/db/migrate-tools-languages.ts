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

async function migrateToolsLanguages() {
  console.log('🔄 Migrating "Tools & Languages" category...\n');

  // 1. Find or create the tools-languages category
  let toolsCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, 'tools-languages'),
  });

  if (!toolsCategory) {
    console.log('Creating "Tools & Languages" category...');
    const [created] = await db.insert(categories).values({
      slug: 'tools-languages',
      name: 'Tools & Languages',
      description: 'Programming languages and AI coding tools you use',
      order: 2,
    }).returning();
    toolsCategory = created;
    console.log('✓ Created category\n');
  } else {
    // Remove existing questions in this category
    const existingQuestions = await db.query.questions.findMany({
      where: eq(questions.categoryId, toolsCategory.id),
    });

    const existingIds = existingQuestions.map(q => q.id);
    if (existingIds.length > 0) {
      console.log(`Removing ${existingIds.length} existing questions...`);
      await db.delete(responses).where(inArray(responses.questionId, existingIds));
      await db.delete(surveyQuestions).where(inArray(surveyQuestions.questionId, existingIds));
      await db.delete(questions).where(inArray(questions.id, existingIds));
      console.log('✓ Removed existing questions\n');
    }
  }

  // 2. Find the 2025 survey
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.year, 2025),
  });

  if (!survey) {
    throw new Error('Survey for 2025 not found. Run seed first.');
  }

  // 3. Define tool options for reuse
  const ideOptions = [
    { id: 'cursor', label: 'Cursor', value: 'cursor' },
    { id: 'windsurf', label: 'Windsurf', value: 'windsurf' },
    { id: 'kiro', label: 'Kiro', value: 'kiro' },
    { id: 'antigravity', label: 'Antigravity', value: 'antigravity' },
    { id: 'zed', label: 'Zed', value: 'zed' },
    { id: 'other', label: 'Other', value: 'other' },
  ];

  const agentOptions = [
    { id: 'claude-code', label: 'Claude Code', value: 'claude-code' },
    { id: 'codex', label: 'Codex', value: 'codex' },
    { id: 'devin', label: 'Devin', value: 'devin' },
    { id: 'jules', label: 'Jules', value: 'jules' },
    { id: 'openhands', label: 'OpenHands', value: 'openhands' },
    { id: 'other', label: 'Other', value: 'other' },
  ];

  const extensionOptions = [
    { id: 'github-copilot', label: 'GitHub Copilot', value: 'github-copilot' },
    { id: 'cline', label: 'Cline', value: 'cline' },
    { id: 'augment-code', label: 'Augment Code', value: 'augment-code' },
    { id: 'amazon-q', label: 'Amazon Q Developer', value: 'amazon-q' },
    { id: 'other', label: 'Other', value: 'other' },
  ];

  const codeReviewOptions = [
    { id: 'coderabbit', label: 'CodeRabbit', value: 'coderabbit' },
    { id: 'greptile', label: 'Greptile', value: 'greptile' },
    { id: 'qodo', label: 'Qodo', value: 'qodo' },
    { id: 'other', label: 'Other', value: 'other' },
  ];

  const appBuilderOptions = [
    { id: 'replit', label: 'Replit', value: 'replit' },
    { id: 'lovable', label: 'Lovable', value: 'lovable' },
    { id: 'bolt', label: 'Bolt.new', value: 'bolt' },
    { id: 'other', label: 'Other', value: 'other' },
  ];

  // 4. Define all questions
  const newQuestions = [
    // Programming Languages
    {
      slug: 'programming-languages',
      prompt: 'What are the programming languages you use?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 1,
      options: [
        { id: 'js-ts', label: 'JavaScript / TypeScript', value: 'js-ts' },
        { id: 'python', label: 'Python', value: 'python' },
        { id: 'go', label: 'Go', value: 'go' },
        { id: 'java', label: 'Java', value: 'java' },
        { id: 'rust', label: 'Rust', value: 'rust' },
        { id: 'c-cpp', label: 'C/C++', value: 'c-cpp' },
        { id: 'csharp', label: 'C#', value: 'csharp' },
        { id: 'php', label: 'PHP', value: 'php' },
        { id: 'ruby', label: 'Ruby', value: 'ruby' },
        { id: 'kotlin', label: 'Kotlin', value: 'kotlin' },
        { id: 'swift', label: 'Swift', value: 'swift' },
        { id: 'scala', label: 'Scala', value: 'scala' },
        { id: 'elixir', label: 'Elixir', value: 'elixir' },
        { id: 'dart', label: 'Dart', value: 'dart' },
        { id: 'other', label: 'Other', value: 'other' },
      ],
    },

    // Currently Use - IDE
    {
      slug: 'tools-use-ide',
      prompt: 'Which AI IDEs do you currently use?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 2,
      options: ideOptions,
    },
    // Currently Use - Autonomous Agents
    {
      slug: 'tools-use-agents',
      prompt: 'Which autonomous agents do you currently use?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 3,
      options: agentOptions,
    },
    // Currently Use - VS Code Extensions
    {
      slug: 'tools-use-extensions',
      prompt: 'Which VS Code extensions do you currently use?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 4,
      options: extensionOptions,
    },
    // Currently Use - Code Review
    {
      slug: 'tools-use-code-review',
      prompt: 'Which AI code review tools do you currently use?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 5,
      options: codeReviewOptions,
    },
    // Currently Use - App Builders
    {
      slug: 'tools-use-app-builders',
      prompt: 'Which AI app builders do you currently use?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 6,
      options: appBuilderOptions,
    },

    // Recommend - IDE
    {
      slug: 'tools-recommend-ide',
      prompt: 'Which AI IDE are you most likely to recommend?',
      description: 'Select one',
      type: 'single' as const,
      order: 7,
      options: ideOptions,
    },
    // Recommend - Autonomous Agents
    {
      slug: 'tools-recommend-agents',
      prompt: 'Which autonomous agent are you most likely to recommend?',
      description: 'Select one',
      type: 'single' as const,
      order: 8,
      options: agentOptions,
    },
    // Recommend - VS Code Extensions
    {
      slug: 'tools-recommend-extensions',
      prompt: 'Which VS Code extension are you most likely to recommend?',
      description: 'Select one',
      type: 'single' as const,
      order: 9,
      options: extensionOptions,
    },
    // Recommend - Code Review
    {
      slug: 'tools-recommend-code-review',
      prompt: 'Which AI code review tool are you most likely to recommend?',
      description: 'Select one',
      type: 'single' as const,
      order: 10,
      options: codeReviewOptions,
    },
    // Recommend - App Builders
    {
      slug: 'tools-recommend-app-builders',
      prompt: 'Which AI app builder are you most likely to recommend?',
      description: 'Select one',
      type: 'single' as const,
      order: 11,
      options: appBuilderOptions,
    },

    // Future Use - IDE
    {
      slug: 'tools-future-ide',
      prompt: 'Which AI IDE would you like to use in the future?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 12,
      options: ideOptions,
    },
    // Future Use - Autonomous Agents
    {
      slug: 'tools-future-agents',
      prompt: 'Which autonomous agent would you like to use in the future?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 13,
      options: agentOptions,
    },
    // Future Use - VS Code Extensions
    {
      slug: 'tools-future-extensions',
      prompt: 'Which VS Code extension would you like to use in the future?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 14,
      options: extensionOptions,
    },
    // Future Use - Code Review
    {
      slug: 'tools-future-code-review',
      prompt: 'Which AI code review tool would you like to use in the future?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 15,
      options: codeReviewOptions,
    },
    // Future Use - App Builders
    {
      slug: 'tools-future-app-builders',
      prompt: 'Which AI app builder would you like to use in the future?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 16,
      options: appBuilderOptions,
    },

    // Capabilities Improvement
    {
      slug: 'capabilities-improvement',
      prompt: 'Which capabilities would you most like to see improved in AI coding agents?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      order: 17,
      options: [
        { id: 'large-codebases', label: 'Better understanding of large codebases', value: 'large-codebases' },
        { id: 'reasoning', label: 'Reasoning', value: 'reasoning' },
        { id: 'fewer-hallucinations', label: 'Fewer hallucinations', value: 'fewer-hallucinations' },
        { id: 'reliable-refactoring', label: 'More reliable refactoring', value: 'reliable-refactoring' },
        { id: 'ide-integration', label: 'Better integration with my IDE', value: 'ide-integration' },
        { id: 'cicd-integration', label: 'Better integration with CI/CD and devops tools', value: 'cicd-integration' },
        { id: 'safer-execution', label: 'Safer code execution (sandboxes, permissions)', value: 'safer-execution' },
        { id: 'better-memory', label: 'Better memory of prior work', value: 'better-memory' },
        { id: 'collaboration', label: 'Better collaboration features (team context, shared agents)', value: 'collaboration' },
        { id: 'affordable-pricing', label: 'More affordable pricing', value: 'affordable-pricing' },
        { id: 'other', label: 'Other (please specify)', value: 'other' },
      ],
    },
  ];

  // 5. Insert questions
  console.log('Adding "Tools & Languages" questions...');
  const createdQuestionIds: number[] = [];

  for (const q of newQuestions) {
    const [created] = await db.insert(questions).values({
      slug: q.slug,
      prompt: q.prompt,
      description: q.description,
      type: q.type,
      options: q.options,
      categoryId: toolsCategory.id,
      order: q.order,
    }).returning();
    
    createdQuestionIds.push(created.id);
    console.log(`✓ Created question: ${q.slug}`);
  }

  // 6. Link questions to survey
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
  console.log(`\n"Tools & Languages" questions:`);
  console.log('  1. Programming languages (multiple)');
  console.log('  2-6. Currently use: IDE, Agents, Extensions, Code Review, App Builders');
  console.log('  7-11. Recommend: IDE, Agents, Extensions, Code Review, App Builders');
  console.log('  12-16. Future use: IDE, Agents, Extensions, Code Review, App Builders');
  console.log('  17. Capabilities improvement (multiple)');
}

migrateToolsLanguages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });



