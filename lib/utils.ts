import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts the domain name from a URL, removing the 'www.' prefix if present
 * @param url The URL to extract the domain from
 * @returns The domain name or the original URL if parsing fails
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch (error) {
    // Return original URL if it's not a valid URL
    return url;
  }
}

/**
 * Calculates the estimated reading time in minutes based on article content
 * Uses an average reading speed of 200 words per minute
 *
 * @param content The article content (HTML or plain text)
 * @returns Object with minutes (number) and formatted reading time (string)
 */
export function calculateReadingTime(content?: string): {
  minutes: number;
  formatted: string;
} {
  // If no content is provided, return minimum reading time
  if (!content) return { minutes: 1, formatted: "1 min read" };

  // Average reading speed (words per minute)
  const wordsPerMinute = 200;

  // Remove HTML tags if present
  const plainText = content.replace(/<[^>]*>/g, "");

  // Count words by splitting on whitespace
  const words = plainText.trim().split(/\s+/);
  const wordCount = words.length;

  // Calculate reading time in minutes, with a minimum of 1 minute
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

  return {
    minutes,
    formatted: `${minutes} min read`,
  };
}

/**
 * Formats reading time in minutes to a readable string
 *
 * @param minutes Reading time in minutes
 * @returns Formatted reading time string (e.g., "3 min read")
 */
export function formatReadingTime(minutes?: number): string {
  if (!minutes) return "1 min read";
  return `${minutes} min read`;
}
