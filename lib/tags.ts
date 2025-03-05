import { supabase } from "@/lib/supabase";

/**
 * Fetches all unique tags from all content types for a specific user
 */
export async function fetchAllTags(userId: string): Promise<string[]> {
  console.log(`[fetchAllTags] Starting fetch for user ${userId}`);

  try {
    // Fetch tags from all content types in parallel
    const [linksResult, articlesResult, notesResult] = await Promise.all([
      supabase.from("links").select("tags").eq("user_id", userId),
      supabase.from("articles").select("tags").eq("user_id", userId),
      supabase.from("notes").select("tags").eq("user_id", userId),
    ]);

    // Handle any errors
    if (linksResult.error) {
      console.error("Error fetching link tags:", linksResult.error);
    }
    if (articlesResult.error) {
      console.error("Error fetching article tags:", articlesResult.error);
    }
    if (notesResult.error) {
      console.error("Error fetching note tags:", notesResult.error);
    }

    // Extract and flatten all tags
    const linkTags = linksResult.data?.flatMap((item) => item.tags || []) || [];
    const articleTags =
      articlesResult.data?.flatMap((item) => item.tags || []) || [];
    const noteTags = notesResult.data?.flatMap((item) => item.tags || []) || [];

    console.log(
      `[fetchAllTags] Found tags - links: ${linkTags.length}, articles: ${articleTags.length}, notes: ${noteTags.length}`
    );

    // Combine all tags, remove duplicates, and sort alphabetically
    const uniqueTags = [...new Set([...linkTags, ...articleTags, ...noteTags])]
      .filter(Boolean) // Remove any null/undefined/empty values
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    console.log(
      `[fetchAllTags] Returning ${uniqueTags.length} unique tags for user ${userId}`
    );
    return uniqueTags;
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

/**
 * Fetches all unique tags from a specific content type for a user
 */
export async function fetchTagsByContentType(
  userId: string,
  contentType: "links" | "articles" | "notes"
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(contentType)
      .select("tags")
      .eq("user_id", userId);

    if (error) {
      console.error(`Error fetching ${contentType} tags:`, error);
      return [];
    }

    const tags = data?.flatMap((item) => item.tags || []) || [];
    const uniqueTags = [...new Set(tags)]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return uniqueTags;
  } catch (error) {
    console.error(`Error fetching ${contentType} tags:`, error);
    return [];
  }
}
