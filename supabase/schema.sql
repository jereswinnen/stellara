-- First, drop triggers
DO $$ 
BEGIN
    -- Try to drop trigger from auth.users table
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Drop triggers from other tables
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
    DROP TRIGGER IF EXISTS update_links_updated_at ON links;
    DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Then drop functions
DO $$
BEGIN
    DROP FUNCTION IF EXISTS handle_new_user();
    DROP FUNCTION IF EXISTS update_updated_at_column();
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Then drop tables (in correct order due to dependencies)
DROP TABLE IF EXISTS links;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS users;

-- Finally drop types
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS book_status;

-- Now create everything in the correct order
-- First create the types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE book_status AS ENUM ('Backlog', 'Reading', 'Finished', 'Abandoned');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create notes table
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

-- Create reading list table
CREATE TABLE books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_title TEXT NOT NULL,
    author TEXT NOT NULL,
    book_cover_url TEXT,
    started_reading_date TIMESTAMP WITH TIME ZONE,
    finished_reading_date TIMESTAMP WITH TIME ZONE,
    status book_status DEFAULT 'Backlog',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

-- Create links table
CREATE TABLE links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    image TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    is_archive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

-- Create articles table
CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    image TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    is_archive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _email TEXT;
    _full_name TEXT;
BEGIN
    -- Get email with fallback
    _email := COALESCE(NEW.email, 'no-email');
    
    -- Get full name with fallback to email
    _full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        'Anonymous User'
    );

    -- Insert or update user
    INSERT INTO users (id, email, full_name)
    VALUES (NEW.id, _email, _full_name)
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, NEW;
        RETURN NEW;
END;
$$;

-- Create triggers
CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_links_updated_at
    BEFORE UPDATE ON links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: PostgreSQL doesn't support OR REPLACE for triggers on other schemas
-- So we need to handle this differently
DO $$
BEGIN
    -- First try to drop the trigger if it exists
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    -- Then create it
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION handle_new_user();
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create trigger on_auth_user_created: %', SQLERRM;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create policies for notes
CREATE POLICY "Users can view their own notes"
    ON notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
    ON notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON notes FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for books
CREATE POLICY "Users can view their own books"
    ON reading_list FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own book entries"
    ON reading_list FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book entries"
    ON reading_list FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book entries"
    ON reading_list FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for links
CREATE POLICY "Users can view their own links"
    ON links FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own links"
    ON links FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links"
    ON links FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links"
    ON links FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for articles
CREATE POLICY "Users can view their own articles"
    ON articles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own articles"
    ON articles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
    ON articles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
    ON articles FOR DELETE
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role; 