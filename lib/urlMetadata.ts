/**
 * Interface for URL metadata
 */
export interface UrlMetadata {
  title: string;
  image?: string;
  description?: string;
}

/**
 * Fetch metadata from a URL
 * This function uses a serverless function to fetch the metadata
 * to avoid CORS issues and to keep API keys secure
 *
 * @param url The URL to fetch metadata from
 * @returns Promise with the metadata
 */
export async function fetchUrlMetadata(
  url: string
): Promise<UrlMetadata | null> {
  if (!url.trim()) {
    return null;
  }

  try {
    // Call our API endpoint that will handle the actual fetching
    const response = await fetch(
      `/api/url-metadata?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      title: data.title || "Untitled",
      image: data.image || undefined,
      description: data.description || undefined,
    };
  } catch (error) {
    console.error("Error fetching URL metadata:", error);
    return null;
  }
}
