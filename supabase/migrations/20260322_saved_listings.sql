-- Create saved_listings table
CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

-- Users can view their own saves
CREATE POLICY "Users can view own saves"
  ON saved_listings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own saves
CREATE POLICY "Users can insert own saves"
  ON saved_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own saves
CREATE POLICY "Users can delete own saves"
  ON saved_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Allow counting saves for any listing (seller visibility)
CREATE POLICY "Anyone can count saves"
  ON saved_listings FOR SELECT
  USING (true);
