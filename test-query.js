import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  console.log('Testing competitor query...\n');

  // Test 1: Simple query
  const { data: simple, error: simpleError } = await supabase
    .from('competitors')
    .select('id, instagram_username, is_active')
    .eq('is_active', true)
    .limit(3);

  console.log('Simple query result:', simple?.length || 0, 'competitors');
  if (simpleError) console.log('Simple error:', simpleError.message);

  // Test 2: With sync_priority
  const { data: withPriority, error: priorityError } = await supabase
    .from('competitors')
    .select('id, instagram_username, last_synced_at, sync_priority')
    .eq('is_active', true)
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(3);

  console.log('\nWith priority query result:', withPriority?.length || 0, 'competitors');
  if (priorityError) console.log('Priority error:', priorityError.message);

  if (withPriority && withPriority.length > 0) {
    withPriority.forEach(c => {
      console.log(`  - @${c.instagram_username} (priority: ${c.sync_priority}, last: ${c.last_synced_at})`);
    });
  }
}

testQuery();
