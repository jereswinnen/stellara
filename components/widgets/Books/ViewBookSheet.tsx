"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookStatus, UpdateBookData } from "@/hooks/useBooks";
import { BookItem } from "@/lib/supabase";
import {
  BookOpenIcon,
  CircleCheckBig,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

interface ViewBookSheetProps {
  book: BookItem;
  onUpdateBook: (bookData: UpdateBookData) => Promise<boolean>;
  onDeleteBook: (bookId: string) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function ViewBookSheet({
  book,
  onUpdateBook,
  onDeleteBook,
  trigger,
}: ViewBookSheetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [originalBook, setOriginalBook] = useState<UpdateBookData>({
    id: book.id,
    book_title: book.book_title,
    author: book.author,
    book_cover_url: book.book_cover_url || "",
    status: book.status,
    rating: book.rating,
  });
  const [editedBook, setEditedBook] = useState<UpdateBookData>({
    id: book.id,
    book_title: book.book_title,
    author: book.author,
    book_cover_url: book.book_cover_url || "",
    status: book.status,
    rating: book.rating,
  });

  // Check if any changes have been made
  const hasChanges = () => {
    return (
      editedBook.book_title !== originalBook.book_title ||
      editedBook.author !== originalBook.author ||
      editedBook.book_cover_url !== originalBook.book_cover_url ||
      editedBook.status !== originalBook.status ||
      editedBook.rating !== originalBook.rating
    );
  };

  // Update local state when book prop changes
  useEffect(() => {
    if (book) {
      const bookData = {
        id: book.id,
        book_title: book.book_title,
        author: book.author,
        book_cover_url: book.book_cover_url || "",
        status: book.status,
        rating: book.rating,
      };
      setOriginalBook(bookData);
      setEditedBook(bookData);
    }
  }, [book]);

  // Handle sheet open/close
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      // Reset form to original values when closing without saving
      setEditedBook({
        id: book.id,
        book_title: book.book_title,
        author: book.author,
        book_cover_url: book.book_cover_url || "",
        status: book.status,
        rating: book.rating,
      });
    }
  };

  // Handle saving book changes
  const handleSaveChanges = async () => {
    if (!editedBook.book_title || !editedBook.author) return;

    setIsSaving(true);
    try {
      const success = await onUpdateBook(editedBook);
      if (success) {
        setIsSheetOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting a book
  const handleDeleteBook = async () => {
    setIsDeleting(true);
    try {
      const success = await onDeleteBook(book.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        setIsSheetOpen(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        {trigger ? (
          <div onClick={() => setIsSheetOpen(true)}>{trigger}</div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSheetOpen(true)}
            className="h-8 w-8"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        )}

        <SheetContent>
          <SheetHeader>
            <SheetTitle>Book Details</SheetTitle>
            <SheetDescription>View and edit book information</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            <div className="flex justify-center mb-4">
              {editedBook.book_cover_url ? (
                <img
                  src={editedBook.book_cover_url}
                  alt={editedBook.book_title}
                  className="h-40 object-cover rounded-md shadow-md"
                />
              ) : (
                <div className="h-40 w-32 bg-muted flex items-center justify-center rounded-md shadow-md">
                  <BookOpenIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="book-title">Book Title</Label>
              <Input
                id="book-title"
                value={editedBook.book_title}
                onChange={(e) =>
                  setEditedBook({ ...editedBook, book_title: e.target.value })
                }
                placeholder="Enter book title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={editedBook.author}
                onChange={(e) =>
                  setEditedBook({ ...editedBook, author: e.target.value })
                }
                placeholder="Enter author name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cover-url">Book Cover URL</Label>
              <Input
                id="cover-url"
                value={editedBook.book_cover_url}
                onChange={(e) =>
                  setEditedBook({
                    ...editedBook,
                    book_cover_url: e.target.value,
                  })
                }
                placeholder="Enter cover image URL"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editedBook.status}
                onValueChange={(value: BookStatus) =>
                  setEditedBook({
                    ...editedBook,
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
                value={editedBook.rating?.toString() || "null"}
                onValueChange={(value) =>
                  setEditedBook({
                    ...editedBook,
                    rating: value === "null" ? undefined : parseInt(value),
                  })
                }
              >
                <SelectTrigger id="rating">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">No Rating</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {book.started_reading_date && (
              <div className="grid gap-2">
                <Label>Started Reading</Label>
                <p className="text-sm text-muted-foreground">
                  {formatDate(book.started_reading_date)}
                </p>
              </div>
            )}

            {book.finished_reading_date && (
              <div className="grid gap-2">
                <Label>Finished Reading</Label>
                <p className="text-sm text-muted-foreground">
                  {formatDate(book.finished_reading_date)}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Added On</Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(book.created_at)}
              </p>
            </div>
          </div>

          <SheetFooter className="flex flex-row">
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isSaving || isDeleting}
            >
              <Trash2Icon className="h-4 w-4" />
              Delete
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveChanges}
              disabled={
                isSaving ||
                isDeleting ||
                !editedBook.book_title ||
                !editedBook.author ||
                !hasChanges()
              }
            >
              <CircleCheckBig className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <b>"{book.book_title}"</b> from your
              reading list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
