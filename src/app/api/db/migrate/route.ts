import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const results: string[] = [];
  const errors: string[] = [];

  try {
    // Test automation_logs with new status
    const testId = 'test-' + Date.now();
    const { error } = await supabase
      .from('automation_logs')
      .insert({
        workflow_name: 'test-constraint',
        execution_id: testId,
        status: 'pending_approval',
        execution_data: { test: true }
      });
    
    if (error) {
      if (error.message.includes('violates check constraint')) {
        errors.push('Status constraint needs update');
      } else if (error.message.includes('execution_data')) {
        errors.push('Column execution_data does not exist');
      } else {
        errors.push(error.message);
      }
    } else {
      results.push('automation_logs works with new status');
      await supabase.from('automation_logs').delete().eq('execution_id', testId);
    }

    // Check scheduled_content
    const { error: scError } = await supabase.from('scheduled_content').select('id').limit(1);
    if (scError?.message?.includes('does not exist')) {
      errors.push('Table scheduled_content does not exist');
    } else {
      results.push('Table scheduled_content accessible');
    }

    const migrationSQL = `
-- Fix automation_logs constraint to allow new statuses
ALTER TABLE automation_logs DROP CONSTRAINT IF EXISTS automation_logs_status_check;
ALTER TABLE automation_logs ADD CONSTRAINT automation_logs_status_check
  CHECK (status IN ('success', 'error', 'warning', 'pending_approval', 'approved', 'rejected', 'processing'));

-- Add execution_data column for storing proposal data
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS execution_data jsonb;

-- Create scheduled_content table for content pipeline
CREATE TABLE IF NOT EXISTS scheduled_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  content_type text NOT NULL,
  topic text NOT NULL,
  caption text,
  script text,
  hashtags text[],
  engagement_prediction text,
  status text DEFAULT 'draft',
  media_url text,
  instagram_media_id text,
  published_at timestamptz,
  scheduled_for timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
    `.trim();

    return NextResponse.json({
      success: errors.length === 0,
      needsMigration: errors.length > 0,
      results,
      errors,
      instructions: errors.length > 0 ? {
        message: 'Execute SQL in Supabase Dashboard',
        url: 'https://supabase.com/dashboard/project/nwhdsboiojmqqfvbelwo/sql/new',
        sql: migrationSQL
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
