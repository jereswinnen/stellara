export interface ArticleContent {
  content: string;
  textContent?: string;
  length?: number;
  title?: string;
  excerpt?: string;
}

/**
 * Fetch article content from a URL
 * This function uses a serverless function to fetch the article content
 * to avoid CORS issues and to keep API keys secure
 *
 * @param url The URL to fetch article content from
 * @returns Promise with the article content
 */
export async function fetchArticleContent(
  url: string
): Promise<ArticleContent | null> {
  if (!url.trim()) {
    return null;
  }

  // Maximum number of retries
  const MAX_RETRIES = 2;
  let retries = 0;
  let lastError: Error | null = null;

  while (retries <= MAX_RETRIES) {
    try {
      // Call our API endpoint that will handle the actual fetching
      const response = await fetch(
        `/api/article-content?url=${encodeURIComponent(url)}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch article content: ${response.statusText}. ${errorText}`
        );
      }

      const data = await response.json();

      // Check if we have actual content
      if (!data.content || data.content.trim().length === 0) {
        if (retries < MAX_RETRIES) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries)); // Exponential backoff
          continue;
        } else {
          throw new Error("No content was extracted from the article");
        }
      }

      return {
        content: data.content || "",
        textContent: data.textContent || "",
        length: data.length || 0,
        title: data.title,
        excerpt: data.excerpt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (retries < MAX_RETRIES) {
        retries++;
        // Wait before retrying with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
      } else {
        console.error(
          "Error fetching article content after retries:",
          lastError
        );
        // Return empty content instead of null to avoid "No content available" message
        return {
          content: `<div class="article-error">
            <p>We had trouble extracting the content from this article.</p>
            <p>Please visit the original article using the link above.</p>
            <p class="text-xs text-muted-foreground mt-2">Error: ${lastError.message}</p>
          </div>`,
          textContent: "Error extracting content",
          length: 0,
        };
      }
    }
  }

  // This should never be reached due to the return in the catch block
  return null;
}
