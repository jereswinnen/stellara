-- Create podcast_feeds table
CREATE TABLE IF NOT EXISTS podcast_feeds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    feed_url TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    artwork_url TEXT,
    website_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, feed_url)
);

-- Create podcast_episodes table
CREATE TABLE IF NOT EXISTS podcast_episodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feed_id UUID REFERENCES podcast_feeds(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    guid TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    audio_url TEXT NOT NULL,
    published_date TIMESTAMP WITH TIME ZONE,
    duration INTEGER DEFAULT 0,
    image_url TEXT,
    is_played BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    play_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(feed_id, guid)
);

-- Enable Row Level Security on both tables
ALTER TABLE podcast_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at columns
CREATE TRIGGER update_podcast_feeds_updated_at
BEFORE UPDATE ON podcast_feeds
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_podcast_episodes_updated_at
BEFORE UPDATE ON podcast_episodes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create policies for podcast_feeds
CREATE POLICY "Users can view their own podcast feeds"
    ON podcast_feeds FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own podcast feeds"
    ON podcast_feeds FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own podcast feeds"
    ON podcast_feeds FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own podcast feeds"
    ON podcast_feeds FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for podcast_episodes
CREATE POLICY "Users can view their own podcast episodes"
    ON podcast_episodes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own podcast episodes"
    ON podcast_episodes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own podcast episodes"
    ON podcast_episodes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own podcast episodes"
    ON podcast_episodes FOR DELETE
    USING (auth.uid() = user_id); 