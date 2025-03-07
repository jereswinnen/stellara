export interface ArticleContent {
  content: string;
  textContent?: string;
  length?: number;
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

  try {
    // Call our API endpoint that will handle the actual fetching
    const response = await fetch(
      `/api/article-content?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch article content: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      content: data.content || "",
      textContent: data.textContent || "",
      length: data.length || 0,
    };
  } catch (error) {
    console.error("Error fetching article content:", error);
    return null;
  }
}
