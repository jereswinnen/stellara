# Migration Scripts

This directory contains migration scripts for the dashboard application.

## Reading Time Migration

The `migrateReadingTime.ts` script calculates and stores reading time for existing articles in the database.

### Prerequisites

- Node.js and npm installed
- Supabase credentials configured in your environment variables

### Running the Migration

1. Make sure you have the required dependencies:

   ```
   npm install ts-node typescript
   ```

2. Run the migration script:

   ```
   npx ts-node scripts/migrateReadingTime.ts
   ```

3. The script will:
   - Find all articles with body content but no reading_time_minutes
   - Calculate reading time for each article
   - Update the articles in batches to avoid rate limits
   - Log progress and any errors

### Database Schema Update

Before running this script, make sure your Supabase database has a `reading_time_minutes` column in the `articles` table. You can add this column through the Supabase dashboard:

1. Go to your Supabase project
2. Navigate to the SQL Editor
3. Run the following SQL:
   ```sql
   ALTER TABLE articles ADD COLUMN reading_time_minutes INTEGER;
   ```

### Troubleshooting

If you encounter any issues:

- Check your Supabase credentials
- Ensure the articles table has the reading_time_minutes column
- Look for error messages in the console output
