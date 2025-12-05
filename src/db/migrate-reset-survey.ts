import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { surveys, categories, questions, surveyQuestions, responses } from './schema';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function resetSurvey() {
  console.log('🔄 Resetting survey to match survey.md...\n');

  // 1. Find the 2025 survey
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.year, 2025),
  });

  if (!survey) {
    throw new Error('Survey for 2025 not found. Run seed first.');
  }

  // 2. Delete all existing data
  console.log('Clearing existing data...');
  await db.delete(responses);
  console.log('✓ Cleared responses');
  await db.delete(surveyQuestions);
  console.log('✓ Cleared survey_questions');
  await db.delete(questions);
  console.log('✓ Cleared questions');
  await db.delete(categories);
  console.log('✓ Cleared categories\n');

  // 3. Create categories in correct order
  console.log('Creating categories...');
  const categoryData = [
    { slug: 'about-you', name: 'About You', description: 'Age, experience, location, and background', order: 1 },
    { slug: 'languages-tools', name: 'Languages & Tools', description: 'Programming languages, AI tools, models, and MCP', order: 2 },
    { slug: 'vibe-engineering', name: 'Vibe Engineering', description: 'How you use AI coding tools', order: 3 },
    { slug: 'final-thoughts', name: 'Final Thoughts', description: 'Any additional feedback', order: 4 },
  ];

  const createdCategories: Record<string, number> = {};
  for (const cat of categoryData) {
    const [created] = await db.insert(categories).values(cat).returning();
    createdCategories[cat.slug] = created.id;
    console.log(`✓ Created: ${cat.name}`);
  }
  console.log('');

  // 4. Define all 33 questions exactly as in survey.md
  const allQuestions = [
    // === ABOUT YOU (7 questions: #1-7) ===
    {
      slug: 'age',
      prompt: 'How old are you?',
      type: 'single' as const,
      categorySlug: 'about-you',
      order: 1,
      options: [
        { id: 'under-18', label: 'Under 18', value: 'under-18' },
        { id: '18-24', label: '18–24', value: '18-24' },
        { id: '25-34', label: '25–34', value: '25-34' },
        { id: '35-44', label: '35–44', value: '35-44' },
        { id: '45-54', label: '45–54', value: '45-54' },
        { id: '55-64', label: '55–64', value: '55-64' },
        { id: '65-plus', label: '65 or older', value: '65-plus' },
        { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
      ],
    },
    {
      slug: 'experience',
      prompt: 'How many years of experience do you have as a developer?',
      type: 'single' as const,
      categorySlug: 'about-you',
      order: 2,
      options: [
        { id: 'less-1', label: 'Less than 1 year', value: 'less-1' },
        { id: '1-2', label: '1–2 years', value: '1-2' },
        { id: '3-5', label: '3–5 years', value: '3-5' },
        { id: '6-10', label: '6–10 years', value: '6-10' },
        { id: '11-15', label: '11–15 years', value: '11-15' },
        { id: '16-20', label: '16–20 years', value: '16-20' },
        { id: '20-plus', label: 'More than 20 years', value: '20-plus' },
      ],
    },
    {
      slug: 'current-role',
      prompt: 'What is your current role?',
      type: 'single' as const,
      categorySlug: 'about-you',
      order: 3,
      options: [
        { id: 'student', label: 'Student', value: 'student' },
        { id: 'ic', label: 'Individual contributor (developer / engineer)', value: 'ic' },
        { id: 'tech-lead', label: 'Tech lead / staff / principal engineer', value: 'tech-lead' },
        { id: 'em', label: 'Engineering manager', value: 'em' },
        { id: 'architect', label: 'Architect', value: 'architect' },
        { id: 'data-ml-ai', label: 'Data / ML / AI engineer', value: 'data-ml-ai' },
        { id: 'devops-sre', label: 'DevOps / SRE / Platform engineer', value: 'devops-sre' },
        { id: 'pm', label: 'Product manager', value: 'pm' },
        { id: 'other', label: 'Other (please specify)', value: 'other' },
      ],
    },
    {
      slug: 'location',
      prompt: 'Where do you primarily work from?',
      type: 'single' as const,
      categorySlug: 'about-you',
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
      slug: 'org-size',
      prompt: 'How many people work at your organization?',
      type: 'single' as const,
      categorySlug: 'about-you',
      order: 5,
      options: [
        { id: 'solo', label: 'Just me (freelance / solo)', value: 'solo' },
        { id: '2-10', label: '2–10', value: '2-10' },
        { id: '11-50', label: '11–50', value: '11-50' },
        { id: '51-200', label: '51–200', value: '51-200' },
        { id: '201-1000', label: '201–1,000', value: '201-1000' },
        { id: '1001-5000', label: '1,001–5,000', value: '1001-5000' },
        { id: '5000-plus', label: 'More than 5,000', value: '5000-plus' },
        { id: 'not-sure', label: 'Not sure', value: 'not-sure' },
      ],
    },
    {
      slug: 'education',
      prompt: 'Do you have a higher education degree?',
      type: 'single' as const,
      categorySlug: 'about-you',
      order: 6,
      options: [
        { id: 'no-degree', label: 'No formal degree', value: 'no-degree' },
        { id: 'bootcamp', label: 'Bootcamp / professional certification', value: 'bootcamp' },
        { id: 'bachelors', label: "Bachelor's degree", value: 'bachelors' },
        { id: 'masters', label: "Master's degree", value: 'masters' },
        { id: 'doctorate', label: 'Doctorate (PhD, etc.)', value: 'doctorate' },
        { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
      ],
    },
    {
      slug: 'employment-status',
      prompt: 'Which one of the following options describes you?',
      type: 'single' as const,
      categorySlug: 'about-you',
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

    // === LANGUAGES & TOOLS (13 questions: #8-20) ===
    {
      slug: 'programming-languages',
      prompt: 'What programming languages do you use?',
      type: 'multiple' as const,
      categorySlug: 'languages-tools',
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
    {
      slug: 'tools-currently-use',
      prompt: 'Which coding tools do you currently use?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      categorySlug: 'languages-tools',
      order: 2,
      options: [
        // IDE
        { id: 'cursor', label: 'Cursor (IDE)', value: 'cursor' },
        { id: 'windsurf', label: 'Windsurf (IDE)', value: 'windsurf' },
        { id: 'kiro', label: 'Kiro (IDE)', value: 'kiro' },
        { id: 'antigravity', label: 'Antigravity (IDE)', value: 'antigravity' },
        { id: 'zed', label: 'Zed (IDE)', value: 'zed' },
        // Autonomous Agents
        { id: 'claude-code', label: 'Claude Code (Agent)', value: 'claude-code' },
        { id: 'codex', label: 'Codex (Agent)', value: 'codex' },
        { id: 'devin', label: 'Devin (Agent)', value: 'devin' },
        { id: 'jules', label: 'Jules (Agent)', value: 'jules' },
        { id: 'openhands', label: 'OpenHands (Agent)', value: 'openhands' },
        // VS Code Extensions
        { id: 'github-copilot', label: 'GitHub Copilot (Extension)', value: 'github-copilot' },
        { id: 'cline', label: 'Cline (Extension)', value: 'cline' },
        { id: 'augment-code', label: 'Augment Code (Extension)', value: 'augment-code' },
        { id: 'amazon-q', label: 'Amazon Q Developer (Extension)', value: 'amazon-q' },
        // Code Review
        { id: 'coderabbit', label: 'CodeRabbit (Code Review)', value: 'coderabbit' },
        { id: 'greptile', label: 'Greptile (Code Review)', value: 'greptile' },
        { id: 'qodo', label: 'Qodo (Code Review)', value: 'qodo' },
        // App Builders
        { id: 'replit', label: 'Replit (App Builder)', value: 'replit' },
        { id: 'lovable', label: 'Lovable (App Builder)', value: 'lovable' },
      ],
    },
    {
      slug: 'other-tools-use',
      prompt: 'Other tools you use?',
      description: 'List any other AI coding tools not mentioned above',
      type: 'text' as const,
      categorySlug: 'languages-tools',
      order: 3,
    },
    {
      slug: 'tools-recommend',
      prompt: 'Which AI coding tool are you most likely to recommend?',
      description: 'Select one from the list, or specify in "Other tools" below',
      type: 'single' as const,
      categorySlug: 'languages-tools',
      order: 4,
      options: [
        // IDE
        { id: 'cursor', label: 'Cursor (IDE)', value: 'cursor' },
        { id: 'windsurf', label: 'Windsurf (IDE)', value: 'windsurf' },
        { id: 'kiro', label: 'Kiro (IDE)', value: 'kiro' },
        { id: 'antigravity', label: 'Antigravity (IDE)', value: 'antigravity' },
        { id: 'zed', label: 'Zed (IDE)', value: 'zed' },
        // Autonomous Agents
        { id: 'claude-code', label: 'Claude Code (Agent)', value: 'claude-code' },
        { id: 'codex', label: 'Codex (Agent)', value: 'codex' },
        { id: 'devin', label: 'Devin (Agent)', value: 'devin' },
        { id: 'jules', label: 'Jules (Agent)', value: 'jules' },
        { id: 'openhands', label: 'OpenHands (Agent)', value: 'openhands' },
        // VS Code Extensions
        { id: 'github-copilot', label: 'GitHub Copilot (Extension)', value: 'github-copilot' },
        { id: 'cline', label: 'Cline (Extension)', value: 'cline' },
        { id: 'augment-code', label: 'Augment Code (Extension)', value: 'augment-code' },
        { id: 'amazon-q', label: 'Amazon Q Developer (Extension)', value: 'amazon-q' },
        // Code Review
        { id: 'coderabbit', label: 'CodeRabbit (Code Review)', value: 'coderabbit' },
        { id: 'greptile', label: 'Greptile (Code Review)', value: 'greptile' },
        { id: 'qodo', label: 'Qodo (Code Review)', value: 'qodo' },
        // App Builders
        { id: 'replit', label: 'Replit (App Builder)', value: 'replit' },
        { id: 'lovable', label: 'Lovable (App Builder)', value: 'lovable' },
      ],
    },
    {
      slug: 'other-tools-recommend',
      prompt: 'Other tools you would recommend?',
      description: 'List any other AI coding tools you would recommend not mentioned above',
      type: 'text' as const,
      categorySlug: 'languages-tools',
      order: 5,
    },
    {
      slug: 'tools-future',
      prompt: 'Which AI coding tool would you like to use in the future?',
      description: 'Select all that apply, or specify in "Other tools" below',
      type: 'multiple' as const,
      categorySlug: 'languages-tools',
      order: 6,
      options: [
        // None option
        { id: 'none-happy', label: 'None. I\'m happy with the tools I use.', value: 'none-happy' },
        // IDE
        { id: 'cursor', label: 'Cursor (IDE)', value: 'cursor' },
        { id: 'windsurf', label: 'Windsurf (IDE)', value: 'windsurf' },
        { id: 'kiro', label: 'Kiro (IDE)', value: 'kiro' },
        { id: 'antigravity', label: 'Antigravity (IDE)', value: 'antigravity' },
        { id: 'zed', label: 'Zed (IDE)', value: 'zed' },
        // Autonomous Agents
        { id: 'claude-code', label: 'Claude Code (Agent)', value: 'claude-code' },
        { id: 'codex', label: 'Codex (Agent)', value: 'codex' },
        { id: 'devin', label: 'Devin (Agent)', value: 'devin' },
        { id: 'jules', label: 'Jules (Agent)', value: 'jules' },
        { id: 'openhands', label: 'OpenHands (Agent)', value: 'openhands' },
        // VS Code Extensions
        { id: 'github-copilot', label: 'GitHub Copilot (Extension)', value: 'github-copilot' },
        { id: 'cline', label: 'Cline (Extension)', value: 'cline' },
        { id: 'augment-code', label: 'Augment Code (Extension)', value: 'augment-code' },
        { id: 'amazon-q', label: 'Amazon Q Developer (Extension)', value: 'amazon-q' },
        // Code Review
        { id: 'coderabbit', label: 'CodeRabbit (Code Review)', value: 'coderabbit' },
        { id: 'greptile', label: 'Greptile (Code Review)', value: 'greptile' },
        { id: 'qodo', label: 'Qodo (Code Review)', value: 'qodo' },
        // App Builders
        { id: 'replit', label: 'Replit (App Builder)', value: 'replit' },
        { id: 'lovable', label: 'Lovable (App Builder)', value: 'lovable' },
      ],
    },
    {
      slug: 'other-tools-future',
      prompt: 'Other tools you want to use in the future?',
      description: 'List any other AI coding tools you want to try not mentioned above',
      type: 'text' as const,
      categorySlug: 'languages-tools',
      order: 7,
    },
    {
      slug: 'capabilities-improvement',
      prompt: 'Which capabilities would you most like to see improved in AI coding agents?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      categorySlug: 'languages-tools',
      order: 8,
      options: [
        { id: 'large-codebases', label: 'Better understanding of large codebases', value: 'large-codebases' },
        { id: 'reasoning', label: 'Reasoning', value: 'reasoning' },
        { id: 'fewer-hallucinations', label: 'Fewer hallucinations', value: 'fewer-hallucinations' },
        { id: 'refactoring', label: 'More reliable refactoring', value: 'refactoring' },
        { id: 'ide-integration', label: 'Better integration with my IDE', value: 'ide-integration' },
        { id: 'cicd-integration', label: 'Better integration with CI/CD and DevOps tools', value: 'cicd-integration' },
        { id: 'safer-execution', label: 'Safer code execution (sandboxes, permissions)', value: 'safer-execution' },
        { id: 'better-memory', label: 'Better memory of prior work', value: 'better-memory' },
        { id: 'collaboration', label: 'Better collaboration features (team context, shared agents)', value: 'collaboration' },
        { id: 'affordable', label: 'More affordable pricing', value: 'affordable' },
        { id: 'other', label: 'Other (please specify)', value: 'other' },
      ],
    },
    // Models questions (#13-15)
    {
      slug: 'models-use',
      prompt: 'Which models do you use?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      categorySlug: 'languages-tools',
      order: 9,
      options: [
        { id: 'opus-4-5', label: 'Opus 4.5', value: 'opus-4-5' },
        { id: 'sonnet-4-5', label: 'Sonnet 4.5', value: 'sonnet-4-5' },
        { id: 'composer-1', label: 'Composer 1', value: 'composer-1' },
        { id: 'gpt-5-1-codex-high', label: 'GPT-5.1 Codex High', value: 'gpt-5-1-codex-high' },
        { id: 'gpt-5-1', label: 'GPT-5.1', value: 'gpt-5-1' },
        { id: 'gpt-5-1-codex-mini', label: 'GPT-5.1 Codex Mini', value: 'gpt-5-1-codex-mini' },
        { id: 'gemini-3-pro', label: 'Gemini 3 Pro', value: 'gemini-3-pro' },
        { id: 'grok-code', label: 'Grok Code', value: 'grok-code' },
        { id: 'kimi-k2', label: 'Kimi K2', value: 'kimi-k2' },
        { id: 'other', label: 'Other', value: 'other' },
        { id: 'dont-know', label: "I don't know which model my tool uses", value: 'dont-know' },
      ],
    },
    {
      slug: 'models-recommend',
      prompt: 'Which models are you likely to recommend?',
      description: 'Select one',
      type: 'single' as const,
      categorySlug: 'languages-tools',
      order: 10,
      options: [
        { id: 'opus-4-5', label: 'Opus 4.5', value: 'opus-4-5' },
        { id: 'sonnet-4-5', label: 'Sonnet 4.5', value: 'sonnet-4-5' },
        { id: 'composer-1', label: 'Composer 1', value: 'composer-1' },
        { id: 'gpt-5-1-codex-high', label: 'GPT-5.1 Codex High', value: 'gpt-5-1-codex-high' },
        { id: 'gpt-5-1', label: 'GPT-5.1', value: 'gpt-5-1' },
        { id: 'gpt-5-1-codex-mini', label: 'GPT-5.1 Codex Mini', value: 'gpt-5-1-codex-mini' },
        { id: 'gemini-3-pro', label: 'Gemini 3 Pro', value: 'gemini-3-pro' },
        { id: 'grok-code', label: 'Grok Code', value: 'grok-code' },
        { id: 'kimi-k2', label: 'Kimi K2', value: 'kimi-k2' },
        { id: 'other', label: 'Other', value: 'other' },
        { id: 'dont-know', label: "I don't know which model my tool uses", value: 'dont-know' },
      ],
    },
    {
      slug: 'models-future',
      prompt: 'Which models would you like to use in the future?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      categorySlug: 'languages-tools',
      order: 11,
      options: [
        { id: 'opus-4-5', label: 'Opus 4.5', value: 'opus-4-5' },
        { id: 'sonnet-4-5', label: 'Sonnet 4.5', value: 'sonnet-4-5' },
        { id: 'composer-1', label: 'Composer 1', value: 'composer-1' },
        { id: 'gpt-5-1-codex-high', label: 'GPT-5.1 Codex High', value: 'gpt-5-1-codex-high' },
        { id: 'gpt-5-1', label: 'GPT-5.1', value: 'gpt-5-1' },
        { id: 'gpt-5-1-codex-mini', label: 'GPT-5.1 Codex Mini', value: 'gpt-5-1-codex-mini' },
        { id: 'gemini-3-pro', label: 'Gemini 3 Pro', value: 'gemini-3-pro' },
        { id: 'grok-code', label: 'Grok Code', value: 'grok-code' },
        { id: 'kimi-k2', label: 'Kimi K2', value: 'kimi-k2' },
        { id: 'other', label: 'Other', value: 'other' },
        { id: 'dont-know', label: "I don't know which model my tool uses", value: 'dont-know' },
      ],
    },
    // MCP questions (#16-20)
    {
      slug: 'mcp-usage',
      prompt: 'Do you currently use any MCP servers?',
      type: 'single' as const,
      categorySlug: 'languages-tools',
      order: 12,
      options: [
        { id: 'yes-several', label: 'Yes — I actively use several', value: 'yes-several' },
        { id: 'yes-one', label: 'Yes — I use one', value: 'yes-one' },
        { id: 'not-yet', label: 'Not yet, but I plan to', value: 'not-yet' },
        { id: 'no-heard', label: "No — I've heard of MCP but don't use it", value: 'no-heard' },
        { id: 'no-unknown', label: "No — I don't know what MCP is", value: 'no-unknown' },
      ],
    },
    {
      slug: 'mcp-count',
      prompt: 'How many MCP servers do you use regularly?',
      type: 'single' as const,
      categorySlug: 'languages-tools',
      order: 13,
      options: [
        { id: '1', label: '1', value: '1' },
        { id: '2-3', label: '2–3', value: '2-3' },
        { id: '4-5', label: '4–5', value: '4-5' },
        { id: 'more-5', label: 'More than 5', value: 'more-5' },
        { id: 'not-sure', label: 'Not sure', value: 'not-sure' },
      ],
    },
    {
      slug: 'mcp-selection-factor',
      prompt: 'Have you selected a coding agent for its support of MCP?',
      type: 'single' as const,
      categorySlug: 'languages-tools',
      order: 14,
      options: [
        { id: 'yes-major', label: 'Yes — MCP support was a major deciding factor', value: 'yes-major' },
        { id: 'yes-somewhat', label: 'Yes — MCP support influenced my decision somewhat', value: 'yes-somewhat' },
        { id: 'no-didnt-matter', label: "No — MCP support didn't matter", value: 'no-didnt-matter' },
        { id: 'no-didnt-know', label: "No — I didn't know MCP support varied between agents", value: 'no-didnt-know' },
        { id: 'not-sure', label: 'Not sure', value: 'not-sure' },
      ],
    },
    {
      slug: 'mcp-servers-care',
      prompt: 'Which MCP servers do you care about?',
      description: 'Open-ended response',
      type: 'text' as const,
      categorySlug: 'languages-tools',
      order: 15,
    },
    {
      slug: 'mcp-importance',
      prompt: 'How important is MCP support for your future tooling decisions?',
      type: 'single' as const,
      categorySlug: 'languages-tools',
      order: 16,
      options: [
        { id: 'extremely', label: 'Extremely important — a must-have', value: 'extremely' },
        { id: 'important', label: 'Important — strong preference', value: 'important' },
        { id: 'somewhat', label: 'Somewhat important — nice to have', value: 'somewhat' },
        { id: 'not-very', label: 'Not very important', value: 'not-very' },
        { id: 'not-at-all', label: 'Not important at all', value: 'not-at-all' },
        { id: 'not-sure', label: 'Not sure', value: 'not-sure' },
      ],
    },

    // === VIBE ENGINEERING (12 questions: #21-32) ===
    {
      slug: 'ai-tools-frequency',
      prompt: 'How often do you use AI coding tools?',
      type: 'single' as const,
      categorySlug: 'vibe-engineering',
      order: 1,
      options: [
        { id: 'daily', label: 'Yes, daily', value: 'daily' },
        { id: 'weekly', label: 'Yes, multiple times per week', value: 'weekly' },
        { id: 'occasionally', label: 'Occasionally', value: 'occasionally' },
        { id: 'tried-stopped', label: "I've tried them but don't use them anymore", value: 'tried-stopped' },
        { id: 'not-yet', label: 'No, not yet', value: 'not-yet' },
        { id: 'not-interested', label: "No, and I'm not interested", value: 'not-interested' },
      ],
    },
    {
      slug: 'review-time',
      prompt: 'How much time do you spend reviewing AI-generated code?',
      type: 'single' as const,
      categorySlug: 'vibe-engineering',
      order: 2,
      options: [
        { id: 'none', label: "I don't, I fully trust the generated code", value: 'none' },
        { id: 'less-1min', label: 'Less than 1 minute per response', value: 'less-1min' },
        { id: '1-3min', label: '1–3 minutes per response', value: '1-3min' },
        { id: '3-5min', label: '3–5 minutes per response', value: '3-5min' },
        { id: 'more-5min', label: 'More than 5 minutes per response', value: 'more-5min' },
        { id: 'not-sure', label: 'Not sure', value: 'not-sure' },
      ],
    },
    {
      slug: 'primary-reasons',
      prompt: 'What are your primary reasons for using AI coding tools or agents?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      categorySlug: 'vibe-engineering',
      order: 3,
      options: [
        { id: 'faster', label: 'To code faster', value: 'faster' },
        { id: 'reduce-repetitive', label: 'To reduce repetitive tasks', value: 'reduce-repetitive' },
        { id: 'improve-quality', label: 'To improve code quality', value: 'improve-quality' },
        { id: 'explore', label: 'To explore unfamiliar languages or frameworks', value: 'explore' },
        { id: 'understand', label: 'To better understand existing code', value: 'understand' },
        { id: 'generate-tests', label: 'To generate tests or documentation automatically', value: 'generate-tests' },
        { id: 'prototype', label: 'To prototype ideas quickly', value: 'prototype' },
        { id: 'learn', label: 'To learn or improve my skills', value: 'learn' },
        { id: 'other', label: 'Other (please specify)', value: 'other' },
      ],
    },
    {
      slug: 'biggest-challenges',
      prompt: 'What are the biggest challenges you face when using AI coding tools?',
      description: 'Select all that apply',
      type: 'multiple' as const,
      categorySlug: 'vibe-engineering',
      order: 4,
      options: [
        { id: 'hallucinations', label: 'Inaccurate or hallucinated code', value: 'hallucinations' },
        { id: 'limited-understanding', label: 'Limited understanding of my codebase', value: 'limited-understanding' },
        { id: 'hard-debug', label: 'Hard to debug AI-generated code', value: 'hard-debug' },
        { id: 'security', label: 'Security or privacy concerns', value: 'security' },
        { id: 'corporate', label: 'Corporate restrictions / compliance', value: 'corporate' },
        { id: 'poor-integration', label: 'Poor integration with my environment', value: 'poor-integration' },
        { id: 'lack-trust', label: 'Lack of trust from my team / reviewers', value: 'lack-trust' },
        { id: 'cost', label: 'Cost of AI tools', value: 'cost' },
        { id: 'no-challenges', label: 'I face no significant challenges', value: 'no-challenges' },
        { id: 'other', label: 'Other (please specify)', value: 'other' },
      ],
    },
    {
      slug: 'company-policy',
      prompt: 'Does your company have formal guidelines or policies on the use of AI coding tools?',
      type: 'single' as const,
      categorySlug: 'vibe-engineering',
      order: 5,
      options: [
        { id: 'encouraged', label: 'Yes — AI tools are officially encouraged', value: 'encouraged' },
        { id: 'allowed-restrictions', label: 'Yes — AI tools are allowed with restrictions', value: 'allowed-restrictions' },
        { id: 'discouraged', label: 'Yes — AI tools are officially discouraged', value: 'discouraged' },
        { id: 'banned', label: 'Yes — AI tools are banned', value: 'banned' },
        { id: 'no-policy', label: 'No — No policy exists', value: 'no-policy' },
        { id: 'not-sure', label: 'Not sure', value: 'not-sure' },
      ],
    },
    {
      slug: 'team-adoption',
      prompt: 'How widely are AI coding tools or agents adopted within your team or organization?',
      type: 'single' as const,
      categorySlug: 'vibe-engineering',
      order: 6,
      options: [
        { id: 'everyone-daily', label: 'Everyone uses them daily', value: 'everyone-daily' },
        { id: 'most-regularly', label: 'Most developers use them regularly', value: 'most-regularly' },
        { id: 'some', label: "Some developers use them, others don't", value: 'some' },
        { id: 'few-early', label: 'Only a few early adopters use them', value: 'few-early' },
        { id: 'discouraged-used', label: 'Officially discouraged, but still used informally', value: 'discouraged-used' },
        { id: 'banned', label: 'Officially banned', value: 'banned' },
        { id: 'not-sure', label: 'Not sure', value: 'not-sure' },
      ],
    },
    {
      slug: 'productivity-impact',
      prompt: 'How have AI coding tools or agents affected your productivity?',
      type: 'single' as const,
      categorySlug: 'vibe-engineering',
      order: 7,
      options: [
        { id: 'significant-increase', label: 'Significantly increased my productivity', value: 'significant-increase' },
        { id: 'moderate-increase', label: 'Moderately increased my productivity', value: 'moderate-increase' },
        { id: 'slight-increase', label: 'Slightly increased my productivity', value: 'slight-increase' },
        { id: 'no-change', label: 'No noticeable change', value: 'no-change' },
        { id: 'slight-decrease', label: 'Slight decrease in productivity', value: 'slight-decrease' },
        { id: 'significant-decrease', label: 'Significant decrease in productivity', value: 'significant-decrease' },
        { id: 'na', label: "Not applicable / I don't use AI tools", value: 'na' },
      ],
    },
    {
      slug: 'better-developer',
      prompt: 'AI coding tools or agents make you a better developer:',
      type: 'single' as const,
      categorySlug: 'vibe-engineering',
      order: 8,
      options: [
        { id: 'strongly-agree', label: 'Strongly agree', value: 'strongly-agree' },
        { id: 'agree', label: 'Agree', value: 'agree' },
        { id: 'neutral', label: 'Neutral', value: 'neutral' },
        { id: 'disagree', label: 'Disagree', value: 'disagree' },
        { id: 'strongly-disagree', label: 'Strongly disagree', value: 'strongly-disagree' },
      ],
    },
    {
      slug: 'measure-impact',
      prompt: 'How do you measure the impact of AI coding tools on your productivity?',
      type: 'multiple' as const,
      categorySlug: 'vibe-engineering',
      order: 9,
      options: [
        { id: 'commits-prs', label: 'Number of commits / PRs', value: 'commits-prs' },
        { id: 'tasks-agents', label: 'Number of tasks assigned to agents', value: 'tasks-agents' },
        { id: 'hours-saved', label: 'Weekly hours saved', value: 'hours-saved' },
        { id: 'human-equivalent', label: 'Human-equivalent hours completed by agents', value: 'human-equivalent' },
        { id: 'maintainability', label: 'Code maintainability', value: 'maintainability' },
        { id: 'cost-savings', label: 'AI cost and savings', value: 'cost-savings' },
        { id: 'change-failure', label: 'Change failure percentage', value: 'change-failure' },
      ],
    },
    {
      slug: 'delegate-tasks',
      prompt: 'Which tasks would you feel comfortable fully delegating to an autonomous coding agent?',
      type: 'multiple' as const,
      categorySlug: 'vibe-engineering',
      order: 10,
      options: [
        { id: 'setup', label: 'Setting up a project or environment', value: 'setup' },
        { id: 'migrations', label: 'Running migrations or database tasks', value: 'migrations' },
        { id: 'refactoring', label: 'Refactoring code with tests', value: 'refactoring' },
        { id: 'boilerplate', label: 'Writing boilerplate code', value: 'boilerplate' },
        { id: 'documentation', label: 'Generating documentation', value: 'documentation' },
        { id: 'cicd', label: 'Creating CI/CD pipelines', value: 'cicd' },
        { id: 'bugs', label: 'Investigating bugs', value: 'bugs' },
        { id: 'pr-review', label: 'Reviewing pull requests', value: 'pr-review' },
        { id: 'deployments', label: 'Managing deployments', value: 'deployments' },
        { id: 'none', label: 'None — I only want assisted, not autonomous agents', value: 'none' },
        { id: 'other', label: 'Other (please specify)', value: 'other' },
      ],
    },
    {
      slug: 'codebase-access',
      prompt: 'What level of access do your AI tools or agents have to your codebase?',
      type: 'single' as const,
      categorySlug: 'vibe-engineering',
      order: 11,
      options: [
        { id: 'full', label: 'Full repository access (all files, branches, history)', value: 'full' },
        { id: 'partial', label: 'Partial access (selected folders or files)', value: 'partial' },
        { id: 'read-only', label: 'Read-only access', value: 'read-only' },
        { id: 'embeddings', label: 'Access via embeddings / vector store', value: 'embeddings' },
        { id: 'mcp-api', label: 'Access via MCP or other tool APIs', value: 'mcp-api' },
        { id: 'manual', label: 'No direct access — I paste code manually', value: 'manual' },
        { id: 'not-sure', label: 'Not sure', value: 'not-sure' },
      ],
    },
    {
      slug: 'skill-development',
      prompt: 'How have AI coding tools affected your personal skill development?',
      type: 'single' as const,
      categorySlug: 'vibe-engineering',
      order: 12,
      options: [
        { id: 'learn-faster', label: 'They are helping me learn faster', value: 'learn-faster' },
        { id: 'more-patterns', label: 'They expose me to more patterns/languages than before', value: 'more-patterns' },
        { id: 'dependent', label: 'They make me more dependent, but still help', value: 'dependent' },
        { id: 'slowing', label: 'They are slowing down my learning', value: 'slowing' },
        { id: 'harming', label: 'They are harming my skills', value: 'harming' },
        { id: 'no-impact', label: 'No noticeable impact', value: 'no-impact' },
        { id: 'not-sure', label: 'Not sure', value: 'not-sure' },
      ],
    },

    // === FINAL THOUGHTS (1 question: #33) ===
    {
      slug: 'anything-else',
      prompt: "Is there anything else you'd like to share?",
      type: 'text' as const,
      categorySlug: 'final-thoughts',
      order: 1,
    },
  ];

  // 5. Insert all questions
  console.log('Creating questions...');
  const createdQuestionIds: number[] = [];

  for (const q of allQuestions) {
    const [created] = await db.insert(questions).values({
      slug: q.slug,
      prompt: q.prompt,
      description: q.description,
      type: q.type,
      options: q.options,
      categoryId: createdCategories[q.categorySlug],
      order: q.order,
    }).returning();
    
    createdQuestionIds.push(created.id);
  }
  console.log(`✓ Created ${createdQuestionIds.length} questions`);

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

  console.log('✅ Reset complete!\n');
  console.log('Survey structure:');
  console.log('  1. About You: 7 questions');
  console.log('  2. Languages & Tools: 16 questions (tools + 3 other tools + models + MCP)');
  console.log('  3. Vibe Engineering: 12 questions');
  console.log('  4. Final Thoughts: 1 question');
  console.log('  ─────────────────────');
  console.log('  Total: 36 questions');
}

resetSurvey()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  });
