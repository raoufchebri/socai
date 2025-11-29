import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { surveys, categories, questions, surveyQuestions } from './schema';

// Load environment variables from .env.local
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Create 2025 Survey
  console.log('Creating survey...');
  const [survey] = await db.insert(surveys).values({
    year: 2025,
    title: 'State of Code 2025',
    description: 'Explore how developers use AI coding agents and tools.',
    status: 'open',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
  }).returning();
  console.log(`✓ Created survey: ${survey.title}\n`);

  // Create Categories
  console.log('Creating categories...');
  const categoriesData = [
    { slug: 'about-you', name: 'About You', description: 'Tell us about yourself', order: 1 },
    { slug: 'ai-tools', name: 'AI Coding Tools', description: 'The tools you use', order: 2 },
    { slug: 'workflow', name: 'Workflow & Impact', description: 'How AI affects your work', order: 3 },
    { slug: 'concerns', name: 'Concerns & Future', description: 'Your thoughts on AI in coding', order: 4 },
  ];

  const createdCategories: Record<string, typeof schema.categories.$inferSelect> = {};
  for (const cat of categoriesData) {
    const [created] = await db.insert(categories).values(cat).returning();
    createdCategories[cat.slug] = created;
    console.log(`✓ Created category: ${cat.name}`);
  }
  console.log('');

  // Create Questions
  console.log('Creating questions...');
  const questionsData = [
    // About You
    {
      slug: 'role',
      prompt: 'What best describes your current role?',
      type: 'single' as const,
      categorySlug: 'about-you',
      order: 1,
      options: [
        { id: 'frontend', label: 'Frontend Developer', value: 'frontend' },
        { id: 'backend', label: 'Backend Developer', value: 'backend' },
        { id: 'fullstack', label: 'Full Stack Developer', value: 'fullstack' },
        { id: 'devops', label: 'DevOps / SRE', value: 'devops' },
        { id: 'mobile', label: 'Mobile Developer', value: 'mobile' },
        { id: 'data', label: 'Data Scientist / ML Engineer', value: 'data' },
        { id: 'student', label: 'Student', value: 'student' },
        { id: 'hobbyist', label: 'Hobbyist', value: 'hobbyist' },
        { id: 'other', label: 'Other', value: 'other' },
      ],
    },
    {
      slug: 'experience',
      prompt: 'How many years have you been coding?',
      type: 'single' as const,
      categorySlug: 'about-you',
      order: 2,
      options: [
        { id: 'less1', label: 'Less than 1 year', value: '<1' },
        { id: '1to3', label: '1-3 years', value: '1-3' },
        { id: '3to5', label: '3-5 years', value: '3-5' },
        { id: '5to10', label: '5-10 years', value: '5-10' },
        { id: '10plus', label: '10+ years', value: '10+' },
      ],
    },
    {
      slug: 'company-size',
      prompt: 'What is the size of your company/organization?',
      type: 'single' as const,
      categorySlug: 'about-you',
      order: 3,
      options: [
        { id: 'solo', label: 'Solo / Freelance', value: 'solo' },
        { id: 'small', label: '2-10 employees', value: '2-10' },
        { id: 'medium', label: '11-50 employees', value: '11-50' },
        { id: 'large', label: '51-200 employees', value: '51-200' },
        { id: 'enterprise', label: '200+ employees', value: '200+' },
        { id: 'student', label: 'Student / Not applicable', value: 'na' },
      ],
    },
    // AI Tools
    {
      slug: 'ai-tools-used',
      prompt: 'Which AI coding tools have you used?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      categorySlug: 'ai-tools',
      order: 1,
      options: [
        { id: 'copilot', label: 'GitHub Copilot', value: 'copilot' },
        { id: 'cursor', label: 'Cursor', value: 'cursor' },
        { id: 'codewhisperer', label: 'Amazon CodeWhisperer', value: 'codewhisperer' },
        { id: 'tabnine', label: 'Tabnine', value: 'tabnine' },
        { id: 'cody', label: 'Sourcegraph Cody', value: 'cody' },
        { id: 'chatgpt', label: 'ChatGPT', value: 'chatgpt' },
        { id: 'claude', label: 'Claude', value: 'claude' },
        { id: 'gemini', label: 'Google Gemini', value: 'gemini' },
        { id: 'windsurf', label: 'Windsurf', value: 'windsurf' },
        { id: 'replit', label: 'Replit AI', value: 'replit' },
        { id: 'none', label: 'None', value: 'none' },
      ],
    },
    {
      slug: 'primary-tool',
      prompt: 'Which is your PRIMARY AI coding tool?',
      type: 'single' as const,
      categorySlug: 'ai-tools',
      order: 2,
      skipCondition: {
        questionSlug: 'ai-tools-used',
        operator: 'includes' as const,
        value: 'none',
      },
      options: [
        { id: 'copilot', label: 'GitHub Copilot', value: 'copilot' },
        { id: 'cursor', label: 'Cursor', value: 'cursor' },
        { id: 'codewhisperer', label: 'Amazon CodeWhisperer', value: 'codewhisperer' },
        { id: 'tabnine', label: 'Tabnine', value: 'tabnine' },
        { id: 'cody', label: 'Sourcegraph Cody', value: 'cody' },
        { id: 'chatgpt', label: 'ChatGPT', value: 'chatgpt' },
        { id: 'claude', label: 'Claude', value: 'claude' },
        { id: 'gemini', label: 'Google Gemini', value: 'gemini' },
        { id: 'windsurf', label: 'Windsurf', value: 'windsurf' },
        { id: 'replit', label: 'Replit AI', value: 'replit' },
      ],
    },
    {
      slug: 'usage-frequency',
      prompt: 'How often do you use AI coding tools?',
      type: 'single' as const,
      categorySlug: 'ai-tools',
      order: 3,
      skipCondition: {
        questionSlug: 'ai-tools-used',
        operator: 'includes' as const,
        value: 'none',
      },
      options: [
        { id: 'constantly', label: 'Constantly (multiple times per hour)', value: 'constantly' },
        { id: 'frequently', label: 'Frequently (several times per day)', value: 'frequently' },
        { id: 'occasionally', label: 'Occasionally (a few times per week)', value: 'occasionally' },
        { id: 'rarely', label: 'Rarely (a few times per month)', value: 'rarely' },
      ],
    },
    // Workflow
    {
      slug: 'tasks',
      prompt: 'What tasks do you use AI coding tools for?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      categorySlug: 'workflow',
      order: 1,
      skipCondition: {
        questionSlug: 'ai-tools-used',
        operator: 'includes' as const,
        value: 'none',
      },
      options: [
        { id: 'autocomplete', label: 'Code autocomplete', value: 'autocomplete' },
        { id: 'generate', label: 'Generating new code', value: 'generate' },
        { id: 'refactor', label: 'Refactoring existing code', value: 'refactor' },
        { id: 'debug', label: 'Debugging', value: 'debug' },
        { id: 'tests', label: 'Writing tests', value: 'tests' },
        { id: 'docs', label: 'Writing documentation', value: 'docs' },
        { id: 'explain', label: 'Explaining code', value: 'explain' },
        { id: 'review', label: 'Code review', value: 'review' },
        { id: 'learn', label: 'Learning new technologies', value: 'learn' },
      ],
    },
    {
      slug: 'productivity-impact',
      prompt: 'How much has AI improved your productivity?',
      type: 'scale' as const,
      categorySlug: 'workflow',
      order: 2,
      skipCondition: {
        questionSlug: 'ai-tools-used',
        operator: 'includes' as const,
        value: 'none',
      },
      scaleMin: 1,
      scaleMax: 5,
      scaleMinLabel: 'No improvement',
      scaleMaxLabel: 'Significantly improved',
    },
    {
      slug: 'code-quality',
      prompt: 'How has AI affected your code quality?',
      type: 'single' as const,
      categorySlug: 'workflow',
      order: 3,
      skipCondition: {
        questionSlug: 'ai-tools-used',
        operator: 'includes' as const,
        value: 'none',
      },
      options: [
        { id: 'better', label: 'Code quality has improved', value: 'better' },
        { id: 'same', label: 'Code quality stayed the same', value: 'same' },
        { id: 'worse', label: 'Code quality has decreased', value: 'worse' },
        { id: 'mixed', label: 'Mixed results', value: 'mixed' },
      ],
    },
    // Concerns
    {
      slug: 'concerns',
      prompt: 'What concerns do you have about AI coding tools?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      categorySlug: 'concerns',
      order: 1,
      options: [
        { id: 'security', label: 'Security vulnerabilities in generated code', value: 'security' },
        { id: 'privacy', label: 'Code privacy / data leakage', value: 'privacy' },
        { id: 'accuracy', label: 'Accuracy of generated code', value: 'accuracy' },
        { id: 'dependency', label: 'Over-reliance on AI', value: 'dependency' },
        { id: 'skills', label: 'Degradation of coding skills', value: 'skills' },
        { id: 'jobs', label: 'Job displacement', value: 'jobs' },
        { id: 'copyright', label: 'Copyright / licensing issues', value: 'copyright' },
        { id: 'cost', label: 'Cost of tools', value: 'cost' },
        { id: 'none', label: 'No concerns', value: 'none' },
      ],
    },
    {
      slug: 'future-role',
      prompt: 'In 5 years, how do you see AI affecting development?',
      type: 'single' as const,
      categorySlug: 'concerns',
      order: 2,
      options: [
        { id: 'essential', label: 'AI will be essential for all developers', value: 'essential' },
        { id: 'common', label: 'AI will be commonly used but optional', value: 'common' },
        { id: 'niche', label: 'AI will remain a niche tool', value: 'niche' },
        { id: 'decline', label: 'AI hype will decline', value: 'decline' },
        { id: 'replace', label: 'AI will replace most coding tasks', value: 'replace' },
      ],
    },
    {
      slug: 'recommendation',
      prompt: 'Would you recommend AI coding tools to other developers?',
      type: 'scale' as const,
      categorySlug: 'concerns',
      order: 3,
      scaleMin: 1,
      scaleMax: 5,
      scaleMinLabel: 'Not at all',
      scaleMaxLabel: 'Absolutely',
    },
  ];

  const createdQuestions: typeof schema.questions.$inferSelect[] = [];
  for (const q of questionsData) {
    const category = createdCategories[q.categorySlug];
    const [created] = await db.insert(questions).values({
      slug: q.slug,
      prompt: q.prompt,
      description: q.description,
      type: q.type,
      options: q.options,
      categoryId: category.id,
      order: q.order,
      skipCondition: q.skipCondition,
      scaleMin: q.scaleMin,
      scaleMax: q.scaleMax,
      scaleMinLabel: q.scaleMinLabel,
      scaleMaxLabel: q.scaleMaxLabel,
    }).returning();
    createdQuestions.push(created);
    console.log(`✓ Created question: ${q.slug}`);
  }
  console.log('');

  // Link questions to survey
  console.log('Linking questions to survey...');
  for (const question of createdQuestions) {
    await db.insert(surveyQuestions).values({
      surveyId: survey.id,
      questionId: question.id,
      required: false,
    });
  }
  console.log(`✓ Linked ${createdQuestions.length} questions to survey\n`);

  console.log('✅ Seeding complete!');
  console.log(`\nSurvey URL: /2025/survey`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });

