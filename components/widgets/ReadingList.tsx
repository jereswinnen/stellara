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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon, BookOpenIcon, SearchIcon, Loader2 } from "lucide-react";

type BookStatus = "Backlog" | "Reading" | "Finished" | "Abandoned";

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

export function ReadingList() {
  const { user } = useAuth();
  const [books, setBooks] = useState<ReadingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [newBook, setNewBook] = useState({
    book_title: "",
    author: "",
    book_cover_url: "",
    status: "Backlog" as BookStatus,
    rating: undefined as number | undefined,
  });

  // Open Library search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<OpenLibraryBook | null>(
    null
  );

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

  // Reset form when sheet is closed
  const resetForm = () => {
    setNewBook({
      book_title: "",
      author: "",
      book_cover_url: "",
      status: "Backlog" as BookStatus,
      rating: undefined,
    });
    setSearchQuery("");
    setSearchResults([]);
    setSelectedBook(null);

    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  // Handle sheet open/close
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      resetForm();
    }
  };

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
      resetForm();
      setIsSheetOpen(false);
      fetchBooks();
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  const searchBooks = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSelectedBook(null);

    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(
          searchQuery
        )}&limit=5`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch books from Open Library");
      }

      const data = await response.json();
      setSearchResults(data.docs || []);
    } catch (error) {
      console.error("Error searching books:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search with debounce
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if the query is empty
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    // Set a new timeout for the search
    searchTimeoutRef.current = setTimeout(() => {
      searchBooks();
    }, 500); // 500ms debounce
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectBook = (book: OpenLibraryBook) => {
    setSelectedBook(book);

    // Prepare the book data for the form
    setNewBook({
      book_title: book.title,
      author: book.author_name ? book.author_name[0] : "Unknown Author",
      book_cover_url: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : "",
      status: "Backlog" as BookStatus,
      rating: undefined,
    });
  };

  const handleAddSelectedBook = async () => {
    if (!user || !selectedBook) return;

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
      resetForm();
      setIsSheetOpen(false);
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
        <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
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

            <Tabs defaultValue="lookup" className="px-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lookup">Lookup</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>

              <TabsContent value="lookup" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for a book title..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        searchBooks();
                      }
                    }}
                  />
                  <Button
                    onClick={searchBooks}
                    disabled={isSearching || !searchQuery.trim()}
                    className="shrink-0"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SearchIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Search Results</h3>
                    <div className="space-y-2">
                      {searchResults.map((book) => (
                        <div
                          key={book.key}
                          className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedBook?.key === book.key
                              ? "border-primary bg-primary/5"
                              : "hover:bg-accent"
                          }`}
                          onClick={() => handleSelectBook(book)}
                        >
                          <div className="flex-shrink-0">
                            {book.cover_i ? (
                              <img
                                src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
                                alt={book.title}
                                className="h-12 w-9 object-cover rounded"
                              />
                            ) : (
                              <div className="h-12 w-9 bg-muted flex items-center justify-center rounded">
                                <BookOpenIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {book.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {book.author_name
                                ? book.author_name[0]
                                : "Unknown Author"}{" "}
                              {book.first_publish_year
                                ? `(${book.first_publish_year})`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : searchQuery && !isSearching ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No books found for "{searchQuery}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try a different search term or add the book manually.
                    </p>
                  </div>
                ) : null}

                {selectedBook && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium">Book Details</h3>

                    <div className="grid gap-2">
                      <Label htmlFor="status-lookup">Status</Label>
                      <Select
                        value={newBook.status}
                        onValueChange={(value: BookStatus) =>
                          setNewBook({
                            ...newBook,
                            status: value,
                          })
                        }
                      >
                        <SelectTrigger id="status-lookup">
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
                      <Label htmlFor="rating-lookup">Rating (1-5)</Label>
                      <Select
                        value={newBook.rating?.toString() || ""}
                        onValueChange={(value) =>
                          setNewBook({
                            ...newBook,
                            rating: value ? parseInt(value) : undefined,
                          })
                        }
                      >
                        <SelectTrigger id="rating-lookup">
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

                    <SheetFooter>
                      <Button onClick={handleAddSelectedBook}>
                        Add to Reading List
                      </Button>
                    </SheetFooter>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="grid gap-4">
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
                        setNewBook({
                          ...newBook,
                          book_cover_url: e.target.value,
                        })
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
                  <Button
                    onClick={handleAddBook}
                    disabled={!newBook.book_title || !newBook.author}
                  >
                    Add Book
                  </Button>
                </SheetFooter>
              </TabsContent>
            </Tabs>
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
