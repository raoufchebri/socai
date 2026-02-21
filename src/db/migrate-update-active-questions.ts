import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient, { schema });

// Questions to deactivate based on user's selection:
// Q1, Q4, Q6, Q7, Q11, Q15, Q16, Q19, Q20, Q26, Q31, Q32
const questionsToDeactivate = [
  // About You
  'age',                // Q1 - How old are you?
  'location',           // Q4 - Where do you primarily work from?
  'education',          // Q6 - Do you have a higher education degree?
  'employment-status',  // Q7 - Which one of the following options describes you?

  // Languages & Tools
  'tools-future',       // Q11 - Which AI coding tool would you like to use in the future?
  'other-tools-future', // Q11 companion - Other tools you want to use
  'models-future',      // Q15 - Which models would you like to use in the future?
  'mcp-usage',          // Q16 - Do you currently use any MCP servers?
  'mcp-servers-care',   // Q19 - Which MCP servers do you care about?
  'mcp-importance',     // Q20 - How important is MCP support for your future tooling decisions?

  // Vibe Engineering
  'team-adoption',      // Q26 - How widely are AI coding tools adopted within your team?
  'codebase-access',    // Q31 - What level of access do your AI tools have to your codebase?
  'skill-development',  // Q32 - How have AI coding tools affected your personal skill development?
];

async function migrate() {
  console.log('🔄 Updating active questions...\n');

  // Step 1: Set ALL questions to active = true first
  console.log('Setting all questions to active...');
  await sqlClient`UPDATE questions SET active = true`;
  console.log('✓ All questions set to active\n');

  // Step 2: Deactivate only the specified questions
  console.log('Deactivating specified questions...');
  
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

  // Step 4: List active questions for verification
  console.log('\n✅ Active questions:');
  const active = await sqlClient`
    SELECT slug, prompt FROM questions WHERE active = true ORDER BY slug
  `;
  for (const q of active) {
    console.log(`  ✓ ${q.slug}: ${q.prompt.substring(0, 50)}...`);
  }

  console.log('\n❌ Deactivated questions:');
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

