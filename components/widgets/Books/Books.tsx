"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenIcon, PlusIcon } from "lucide-react";
import { ViewBookSheet } from "@/components/widgets/Books/ViewBookSheet";
import { useBooks } from "@/hooks/useBooks";
import {
  useCommandMenu,
  bookListEvents,
} from "@/components/providers/command-menu-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect } from "react";

export function Books() {
  const { user } = useAuth();
  const { loading, currentlyReadingBooks, updateBook, deleteBook, fetchBooks } =
    useBooks(user);
  const { openAddBookSheet } = useCommandMenu();

  // Listen for book list refresh events
  useEffect(() => {
    // Subscribe to book list refresh events
    const unsubscribe = bookListEvents.subscribe(() => {
      fetchBooks();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [fetchBooks]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Books</CardTitle>
        <Button size="sm" className="h-8 w-8 p-0" onClick={openAddBookSheet}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading books...</p>
          </div>
        ) : currentlyReadingBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentlyReadingBooks.map((book) => (
              <ViewBookSheet
                key={book.id}
                book={book}
                onUpdateBook={updateBook}
                onDeleteBook={deleteBook}
                trigger={
                  <div className="flex items-center space-x-4 border rounded-lg p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex-shrink-0">
                      {book.book_cover_url ? (
                        <img
                          src={book.book_cover_url}
                          alt={book.book_title}
                          className="h-16 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-12 bg-muted flex items-center justify-center rounded">
                          <BookOpenIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {book.book_title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {book.author}
                      </p>
                      <p className="text-xs mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                            book.status === "Reading"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : book.status === "Finished"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                              : book.status === "Abandoned"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {book.status}
                        </span>
                      </p>
                    </div>
                  </div>
                }
              />
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
      </CardContent>
    </Card>
  );
}
