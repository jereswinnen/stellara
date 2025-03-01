"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase, ReadingListItem } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon, BookOpenIcon } from "lucide-react";

type BookStatus = "Backlog" | "Reading" | "Finished" | "Abandoned";

export function ReadingList() {
  const { user } = useAuth();
  const [books, setBooks] = useState<ReadingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const [newBook, setNewBook] = useState({
    book_title: "",
    author: "",
    book_cover_url: "",
    status: "Backlog" as BookStatus,
    rating: undefined as number | undefined,
  });

  const fetchBooks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reading_list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching books:", error);
        return;
      }

      setBooks(data || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (!initialFetchDone.current || userIdRef.current !== user.id)) {
      userIdRef.current = user.id;
      fetchBooks();
      initialFetchDone.current = true;
    }
  }, [user]);

  const handleAddBook = async () => {
    if (!user) return;
    if (!newBook.book_title || !newBook.author) return;

    try {
      const { error } = await supabase.from("reading_list").insert({
        book_title: newBook.book_title,
        author: newBook.author,
        book_cover_url: newBook.book_cover_url || null,
        status: newBook.status,
        rating: newBook.rating,
        user_id: user.id,
        started_reading_date:
          newBook.status === "Reading" ? new Date().toISOString() : null,
        finished_reading_date:
          newBook.status === "Finished" ? new Date().toISOString() : null,
      });

      if (error) {
        console.error("Error adding book:", error);
        return;
      }

      // Reset form and refresh books
      setNewBook({
        book_title: "",
        author: "",
        book_cover_url: "",
        status: "Backlog" as BookStatus,
        rating: undefined,
      });
      fetchBooks();
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  const currentlyReadingBooks = books.filter(
    (book) => book.status === "Reading"
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Reading List</CardTitle>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" className="h-8 w-8 p-0">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add a new book</SheetTitle>
              <SheetDescription>
                Add a new book to your reading list.
              </SheetDescription>
            </SheetHeader>
            <div className="p-4 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="book-title">Book Title</Label>
                <Input
                  id="book-title"
                  value={newBook.book_title}
                  onChange={(e) =>
                    setNewBook({ ...newBook, book_title: e.target.value })
                  }
                  placeholder="Enter book title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={newBook.author}
                  onChange={(e) =>
                    setNewBook({ ...newBook, author: e.target.value })
                  }
                  placeholder="Enter author name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cover-url">Book Cover URL (optional)</Label>
                <Input
                  id="cover-url"
                  value={newBook.book_cover_url}
                  onChange={(e) =>
                    setNewBook({ ...newBook, book_cover_url: e.target.value })
                  }
                  placeholder="Enter cover image URL"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newBook.status}
                  onValueChange={(value: BookStatus) =>
                    setNewBook({
                      ...newBook,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Backlog">Backlog</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                    <SelectItem value="Finished">Finished</SelectItem>
                    <SelectItem value="Abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Select
                  value={newBook.rating?.toString() || ""}
                  onValueChange={(value) =>
                    setNewBook({
                      ...newBook,
                      rating: value ? parseInt(value) : undefined,
                    })
                  }
                >
                  <SelectTrigger id="rating">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Star</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button onClick={handleAddBook}>Add Book</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
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
