-- ============================================================================
-- LIVING SCRIPT & SCRIPTORIUM DASHBOARD — SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Run this script in the Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New query -> Paste & Run

-- 1. Create the travellers table
CREATE TABLE IF NOT EXISTS public.travellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create the messages table with foreign key relationship: messages.sender_id -> travellers.id
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.travellers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  handwriting_content JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes for efficient sorting and filtering
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.travellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies for Public / Anonymous Prototype Access
-- Allow anyone with the anon key to read travellers
CREATE POLICY "Allow anon select on travellers"
  ON public.travellers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone with the anon key to register a new traveller
CREATE POLICY "Allow anon insert on travellers"
  ON public.travellers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone with the anon key to read messages in the shared world
CREATE POLICY "Allow anon select on messages"
  ON public.messages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone with the anon key to insert a new message
CREATE POLICY "Allow anon insert on messages"
  ON public.messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6. Enable Supabase Realtime for the messages table
-- (Allows live updates on the dashboard when other travellers post letters)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- In case supabase_realtime publication is created differently
    NULL;
END $$;
