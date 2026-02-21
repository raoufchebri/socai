import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import 'dotenv/config';

async function closeSurvey() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log('🔒 Closing the 2025 survey...\n');

  // Update survey status to 'closed'
  const result = await db
    .update(schema.surveys)
    .set({ status: 'closed' })
    .where(eq(schema.surveys.year, 2025))
    .returning();

  if (result.length > 0) {
    console.log('✅ Survey closed successfully!');
    console.log(`   Title: ${result[0].title}`);
    console.log(`   Status: ${result[0].status}`);
  } else {
    console.log('❌ No survey found for year 2025');
  }
}

closeSurvey().catch(console.error);
