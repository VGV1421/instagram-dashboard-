-- Fix: Add status column to alerts table
-- Run this in Supabase SQL Editor

-- Add status column if it doesn't exist
ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread';

-- Update existing rows to have 'unread' status
UPDATE alerts
SET status = 'unread'
WHERE status IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
