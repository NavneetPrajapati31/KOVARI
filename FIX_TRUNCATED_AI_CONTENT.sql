-- Fix AI Overview Truncation Issue
-- The 'ai_overview' column is likely set to VARCHAR(50), causing text to be cut off.
-- Run this command in your Supabase SQL Editor to change it to TEXT (unlimited length).

ALTER TABLE groups ALTER COLUMN ai_overview TYPE text;
