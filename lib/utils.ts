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
