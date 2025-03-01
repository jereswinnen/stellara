-- Create a new type for book status
CREATE TYPE book_status AS ENUM ('Backlog', 'Reading', 'Finished', 'Abandoned');

-- Add new columns to the reading_list table
ALTER TABLE reading_list 
ADD COLUMN status book_status DEFAULT 'Backlog',
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Update the existing rows to have a default status based on their reading dates
UPDATE reading_list
SET status = 
  CASE 
    WHEN finished_reading_date IS NOT NULL THEN 'Finished'::book_status
    WHEN started_reading_date IS NOT NULL THEN 'Reading'::book_status
    ELSE 'Backlog'::book_status
  END; 