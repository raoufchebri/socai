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

// Additional questions to deactivate (adding to existing deactivated ones)
const questionsToDeactivate = [
  'org-size',              // Q5 - How many people work at your organization?
  'other-tools-recommend', // Q10b - Other tools you would recommend?
  'models-recommend',      // Q14 - Which models are you likely to recommend?
  'mcp-count',             // Q17 - How many MCP servers do you use regularly?
  'mcp-selection-factor',  // Q18 - Have you selected a coding agent for MCP support?
];

async function migrate() {
  console.log('🔄 Deactivating additional questions...\n');

  // Deactivate the specified questions
  console.log('Deactivating questions...');
  
  await sqlClient`
    UPDATE questions 
    SET active = false 
    WHERE slug = ANY(${questionsToDeactivate})
  `;

  console.log(`✓ Deactivated ${questionsToDeactivate.length} more questions\n`);

  // Show summary
  const activeCount = await sqlClient`SELECT COUNT(*) as count FROM questions WHERE active = true`;
  const inactiveCount = await sqlClient`SELECT COUNT(*) as count FROM questions WHERE active = false`;

  console.log('📊 Summary:');
  console.log(`  Active questions: ${activeCount[0].count}`);
  console.log(`  Inactive questions: ${inactiveCount[0].count}`);
  console.log(`  Total questions: ${Number(activeCount[0].count) + Number(inactiveCount[0].count)}`);

  // List active questions
  console.log('\n✅ Active questions:');
  const active = await sqlClient`
    SELECT slug, prompt FROM questions WHERE active = true ORDER BY slug
  `;
  for (const q of active) {
    console.log(`  ✓ ${q.slug}: ${q.prompt.substring(0, 50)}...`);
  }

  console.log('\n✅ Migration complete!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });

