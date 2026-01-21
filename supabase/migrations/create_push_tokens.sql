-- Push Tokens Table
-- Store push notification tokens for each user device

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'expo', -- 'expo', 'fcm', 'apns'
  platform TEXT NOT NULL, -- 'ios', 'android', 'web'
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint on user_id + token to prevent duplicates
  UNIQUE(user_id, token)
);

-- Index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see/modify their own tokens
CREATE POLICY "Users can view their own push tokens"
  ON public.push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
  ON public.push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON public.push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
  ON public.push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_token_timestamp();

-- Comments
COMMENT ON TABLE public.push_tokens IS 'Stores push notification tokens for user devices';
COMMENT ON COLUMN public.push_tokens.token IS 'The push notification token (Expo, FCM, or APNs)';
COMMENT ON COLUMN public.push_tokens.token_type IS 'Type of token: expo, fcm, or apns';
COMMENT ON COLUMN public.push_tokens.platform IS 'Platform: ios, android, or web';
