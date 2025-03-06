/**
 * Migration script to calculate reading time for existing articles
 *
 * Run this script with:
 * npx ts-node scripts/migrateReadingTime.ts
 */

import { supabase } from "../lib/supabase";
import { calculateReadingTime } from "../lib/utils";

async function migrateReadingTime() {
  console.log("Starting reading time migration...");

  try {
    // Fetch all articles that have body content but no reading_time_minutes
    const { data: articles, error } = await supabase
      .from("articles")
      .select("id, body")
      .is("reading_time_minutes", null)
      .not("body", "is", null);

    if (error) {
      throw error;
    }

    console.log(`Found ${articles.length} articles to update`);

    // Process articles in batches to avoid rate limits
    const batchSize = 50;
    const batches = Math.ceil(articles.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, articles.length);
      const batch = articles.slice(start, end);

      console.log(
        `Processing batch ${i + 1}/${batches} (${batch.length} articles)`
      );

      // Process each article in the batch
      const updates = batch
        .map((article) => {
          if (!article.body) return null;

          const readingTime = calculateReadingTime(article.body);

          return {
            id: article.id,
            reading_time_minutes: readingTime.minutes,
          };
        })
        .filter(Boolean);

      // Update articles in batch
      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from("articles")
          .upsert(updates);

        if (updateError) {
          console.error("Error updating batch:", updateError);
        }
      }

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run the migration
migrateReadingTime();
