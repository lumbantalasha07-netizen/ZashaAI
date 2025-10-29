/*
  # Create leads table for email outreach automation

  1. New Tables
    - `leads`
      - `id` (varchar, primary key) - Unique identifier for each lead
      - `first_name` (text, not null) - Lead's first name
      - `last_name` (text) - Lead's last name
      - `company` (text) - Company name
      - `website` (text) - Company website URL
      - `domain` (text) - Company domain
      - `has_website` (boolean, default false) - Whether the company has a website
      - `profile_url` (text) - Social profile URL (LinkedIn, Instagram, etc.)
      - `email` (text) - Original email from CSV
      - `found_email` (text) - Email found by Prospeo API
      - `email_confidence` (text) - Confidence score from Prospeo
      - `enrichment_status` (text, default 'pending') - Status: pending, enriched, failed, skipped
      - `send_status` (text, default 'pending') - Status: pending, sending, sent, failed
      - `subject` (text) - Email subject line
      - `message_body` (text) - Email message content
      - `error_message` (text) - Error message if enrichment or send fails
      - `sent_at` (timestamp) - When the email was sent
      - `created_at` (timestamp, default now()) - When the lead was created

  2. Security
    - Enable RLS on `leads` table
    - Add policy for service role to manage all leads (since this is an automation tool)
*/

CREATE TABLE IF NOT EXISTS leads (
  id varchar PRIMARY KEY,
  first_name text NOT NULL,
  last_name text,
  company text,
  website text,
  domain text,
  has_website boolean DEFAULT false NOT NULL,
  profile_url text,
  email text,
  found_email text,
  email_confidence text,
  enrichment_status text DEFAULT 'pending' NOT NULL,
  send_status text DEFAULT 'pending' NOT NULL,
  subject text,
  message_body text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all leads"
  ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access for automation"
  ON leads
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access for automation"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access for automation"
  ON leads
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access for automation"
  ON leads
  FOR DELETE
  TO anon
  USING (true);