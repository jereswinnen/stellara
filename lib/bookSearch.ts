export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

/**
 * Search for books in the Open Library API
 * @param query The search query
 * @param limit Maximum number of results to return
 * @returns Promise with search results
 */
export async function searchBooks(
  query: string,
  limit: number = 5
): Promise<OpenLibraryBook[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(
        query
      )}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch books from Open Library");
    }

    const data = await response.json();
    return data.docs || [];
  } catch (error) {
    console.error("Error searching books:", error);
    return [];
  }
}

/**
 * Get the cover image URL for a book
 * @param coverId The cover ID from Open Library
 * @param size Size of the cover image (S, M, L)
 * @returns The URL for the cover image
 */
export function getBookCoverUrl(
  coverId: number | undefined,
  size: "S" | "M" | "L" = "M"
): string {
  if (!coverId) return "";
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

/**
 * Format book data from Open Library for our application
 * @param book The book data from Open Library
 * @returns Formatted book data
 */
export function formatBookData(book: OpenLibraryBook) {
  return {
    book_title: book.title,
    author: book.author_name ? book.author_name[0] : "Unknown Author",
    book_cover_url: getBookCoverUrl(book.cover_i),
  };
}
