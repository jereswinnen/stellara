"use client";

import { useState, useRef, useEffect } from "react";
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
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusIcon,
  BookOpenIcon,
  SearchIcon,
  Loader2,
  CircleCheckBig,
} from "lucide-react";
import { BookStatus, NewBookData } from "@/hooks/useReadingList";
import {
  OpenLibraryBook,
  searchBooks,
  formatBookData,
  getBookCoverUrl,
} from "@/lib/bookSearch";

interface AddBookSheetProps {
  onAddBook: (bookData: NewBookData) => Promise<boolean>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddBookSheet({
  onAddBook,
  isOpen,
  onOpenChange,
}: AddBookSheetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [newBook, setNewBook] = useState<NewBookData>({
    book_title: "",
    author: "",
    book_cover_url: "",
    status: "Backlog",
  });

  // Open Library search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<OpenLibraryBook | null>(
    null
  );

  // Focus on search input when sheet opens
  useEffect(() => {
    const sheetOpen = isOpen !== undefined ? isOpen : isSheetOpen;

    if (sheetOpen) {
      // Use multiple attempts with increasing delays to ensure focus
      const attempts = [100, 200, 300, 500];

      attempts.forEach((delay) => {
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, delay);
      });
    }
  }, [isOpen, isSheetOpen]);

  // Reset form when sheet is closed
  const resetForm = () => {
    setNewBook({
      book_title: "",
      author: "",
      book_cover_url: "",
      status: "Backlog",
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
    onOpenChange?.(open);

    if (open) {
      // Focus the search input when the sheet opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      resetForm();
    }
  };

  // Handle adding a book manually
  const handleAddBook = async () => {
    if (!newBook.book_title || !newBook.author) return;

    const success = await onAddBook(newBook);
    if (success) {
      resetForm();
      // Let the parent component handle closing the sheet
    }
  };

  // Handle book search
  const handleBookSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSelectedBook(null);

    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
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
      handleBookSearch();
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

  // Handle selecting a book from search results
  const handleSelectBook = (book: OpenLibraryBook) => {
    setSelectedBook(book);
    setNewBook({
      ...formatBookData(book),
      status: "Backlog",
      rating: undefined,
    });
  };

  // Handle adding a selected book
  const handleAddSelectedBook = async () => {
    if (!selectedBook) return;

    const success = await onAddBook(newBook);
    if (success) {
      resetForm();
      // Let the parent component handle closing the sheet
    }
  };

  return (
    <Sheet
      open={isOpen !== undefined ? isOpen : isSheetOpen}
      onOpenChange={handleSheetOpenChange}
    >
      {/* Only show the trigger button if isOpen is not provided externally */}
      {isOpen === undefined && (
        <SheetTrigger asChild>
          <Button size="sm" className="h-8 w-8 p-0">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
      )}
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
                ref={searchInputRef}
                placeholder="Search for a book title..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleBookSearch();
                  }
                }}
                tabIndex={0}
                autoFocus
              />
              <Button
                onClick={handleBookSearch}
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
                            src={getBookCoverUrl(book.cover_i, "S")}
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
                <p className="text-sm">
                  No books found for <b>"{searchQuery}"</b>
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

                <SheetFooter className="p-0">
                  <Button onClick={handleAddSelectedBook}>
                    <CircleCheckBig className="h-4 w-4" />
                    Add Book
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

            <SheetFooter className="p-0">
              <Button
                onClick={handleAddBook}
                disabled={!newBook.book_title || !newBook.author}
              >
                <CircleCheckBig className="h-4 w-4" />
                Add Book
              </Button>
            </SheetFooter>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
