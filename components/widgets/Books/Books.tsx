"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenIcon, Loader2, PlusIcon } from "lucide-react";
import { ViewBookSheet } from "@/components/widgets/Books/ViewBookSheet";
import { useBooks } from "@/hooks/useBooks";
import {
  useCommandMenu,
  bookListEvents,
} from "@/components/providers/CommandMenuProvider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { BookItem } from "@/lib/supabase";

export function Books() {
  const { user } = useAuth();
  const { loading, currentlyReadingBooks, updateBook, deleteBook, fetchBooks } =
    useBooks(user);
  const { openAddBookSheet } = useCommandMenu();
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [isViewBookOpen, setIsViewBookOpen] = useState(false);

  // Listen for book list refresh events
  useEffect(() => {
    // Subscribe to book list refresh events
    const unsubscribe = bookListEvents.subscribe(() => {
      fetchBooks();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [fetchBooks]);

  // Handle updating a book
  const handleUpdateBook = async (bookData: any) => {
    const success = await updateBook(bookData);

    if (success) {
      // Notify all components that need to refresh their book lists
      bookListEvents.emit();

      // Close the sheet after successful update
      setIsViewBookOpen(false);
    }

    return success;
  };

  // Handle deleting a book
  const handleDeleteBook = async (bookId: string) => {
    const success = await deleteBook(bookId);

    if (success) {
      // Notify all components that need to refresh their book lists
      bookListEvents.emit();

      // Close the sheet after successful delete
      setIsViewBookOpen(false);
    }

    return success;
  };

  // Open the view book sheet
  const openViewBookSheet = (book: BookItem) => {
    setSelectedBook(book);
    setIsViewBookOpen(true);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Books</CardTitle>
        <Button size="sm" className="h-8 w-8 p-0" onClick={openAddBookSheet}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex gap-2 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading books...</p>
          </div>
        ) : currentlyReadingBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentlyReadingBooks.map((book) => (
              <div
                key={book.id}
                className="flex gap-3 items-center border rounded-md p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => openViewBookSheet(book)}
              >
                <div className="flex-shrink-0">
                  {book.book_cover_url ? (
                    <img
                      src={book.book_cover_url}
                      alt={book.book_title}
                      className="h-14 w-10 object-cover rounded"
                    />
                  ) : (
                    <div className="h-14 w-10 bg-muted flex items-center justify-center rounded">
                      <BookOpenIcon className="size-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium line-clamp-1">
                    {book.book_title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {book.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <BookOpenIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No books in your list yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={openAddBookSheet}
            >
              Add your first book
            </Button>
          </div>
        )}

        {/* ViewBookSheet - only render when a book is selected */}
        {selectedBook && (
          <ViewBookSheet
            book={selectedBook}
            onUpdateBook={handleUpdateBook}
            onDeleteBook={handleDeleteBook}
            isOpen={isViewBookOpen}
            onOpenChange={setIsViewBookOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}
