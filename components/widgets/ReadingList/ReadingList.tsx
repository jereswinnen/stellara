"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenIcon } from "lucide-react";
import { AddBookSheet } from "@/components/widgets/ReadingList/AddBookSheet";
import { useReadingList } from "@/hooks/useReadingList";

export function ReadingList() {
  const { user } = useAuth();
  const { loading, currentlyReadingBooks, addBook } = useReadingList(user);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Reading List</CardTitle>
        <AddBookSheet onAddBook={addBook} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading books...</p>
          </div>
        ) : currentlyReadingBooks.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Currently Reading</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentlyReadingBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center space-x-4 border rounded-lg p-3"
                >
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <BookOpenIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any books in your reading list.
            </p>
            <p className="text-xs text-muted-foreground">
              Click the + button to add a book.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
