import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient, { schema });

// Questions to deactivate (based on survey shortening analysis)
const questionsToDeactivate = [
  // About You (remove 3 of 7)
  'org-size',           // Company size - nice to have but not essential
  'education',          // Education level - low correlation with AI tool insights
  'employment-status',  // Employment type - overlaps with role question

  // Languages & Tools (remove 9 of 13)
  'tools-recommend',        // Redundant with tools-currently-use
  'other-tools-recommend',  // Open-ended for recommend
  'tools-future',           // Speculative, less actionable
  'other-tools-future',     // Open-ended for future
  'models-recommend',       // Redundant with models-use
  'models-future',          // Speculative
  'mcp-count',              // Too granular - mcp-usage captures essence
  'mcp-selection-factor',   // Too niche
  'mcp-servers-care',       // Open-ended, very niche
  'mcp-importance',         // Over-indexed on MCP
  'capabilities-improvement', // Can capture in final thoughts

  // Vibe Engineering (remove 5 of 12)
  'review-time',        // Interesting but not essential
  'team-adoption',      // Redundant with company-policy
  'better-developer',   // Overlaps with productivity-impact and skill-development
  'measure-impact',     // Too granular, most won't have formal metrics
  'codebase-access',    // Technical/niche concern
];

async function migrate() {
  console.log('🔄 Adding active column to questions table...\n');

  // Step 1: Check if column already exists
  const checkColumn = await sqlClient`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'active'
  `;

  if (checkColumn.length === 0) {
    // Add the column with default true (all existing questions remain active)
    console.log('Adding active column...');
    await sqlClient`ALTER TABLE questions ADD COLUMN active BOOLEAN NOT NULL DEFAULT true`;
    console.log('✓ Added active column\n');
  } else {
    console.log('✓ Active column already exists\n');
  }

  // Step 2: Deactivate specific questions
  console.log('Deactivating questions to shorten survey...');
  
  const placeholders = questionsToDeactivate.map((_, i) => `$${i + 1}`).join(', ');
  
  const result = await sqlClient`
    UPDATE questions 
    SET active = false 
    WHERE slug = ANY(${questionsToDeactivate})
  `;

  console.log(`✓ Deactivated ${questionsToDeactivate.length} questions\n`);

  // Step 3: Show summary
  const activeCount = await sqlClient`SELECT COUNT(*) as count FROM questions WHERE active = true`;
  const inactiveCount = await sqlClient`SELECT COUNT(*) as count FROM questions WHERE active = false`;

  console.log('📊 Summary:');
  console.log(`  Active questions: ${activeCount[0].count}`);
  console.log(`  Inactive questions: ${inactiveCount[0].count}`);
  console.log(`  Total questions: ${Number(activeCount[0].count) + Number(inactiveCount[0].count)}`);

  // Step 4: List deactivated questions for verification
  console.log('\n📝 Deactivated questions:');
  const deactivated = await sqlClient`
    SELECT slug, prompt FROM questions WHERE active = false ORDER BY slug
  `;
  for (const q of deactivated) {
    console.log(`  - ${q.slug}: ${q.prompt.substring(0, 50)}...`);
  }

  console.log('\n✅ Migration complete!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });

