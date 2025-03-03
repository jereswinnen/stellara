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
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  PlusIcon,
  StickyNoteIcon,
  Loader2,
  CircleCheckBig,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Define the data structure for a new note
interface NewNoteData {
  title: string;
  content: string;
  tags: string[];
}

interface AddNoteSheetProps {
  onAddNote: (noteData: NewNoteData) => Promise<boolean>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddNoteSheet({
  onAddNote,
  isOpen,
  onOpenChange,
}: AddNoteSheetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [newNote, setNewNote] = useState<NewNoteData>({
    title: "",
    content: "",
    tags: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Focus on title input when sheet opens
  useEffect(() => {
    const sheetOpen = isOpen !== undefined ? isOpen : isSheetOpen;

    if (sheetOpen) {
      // Use multiple attempts with increasing delays to ensure focus
      const attempts = [100, 200, 300, 500];

      attempts.forEach((delay) => {
        setTimeout(() => {
          if (titleInputRef.current) {
            titleInputRef.current.focus();
          }
        }, delay);
      });
    }
  }, [isOpen, isSheetOpen]);

  // Reset form when sheet is closed
  const resetForm = () => {
    setNewNote({
      title: "",
      content: "",
      tags: [],
    });
    setNewTag("");
    setSuccess(false);
  };

  // Handle sheet open/close
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    onOpenChange?.(open);

    if (open) {
      // Focus the title input when the sheet opens
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    } else {
      resetForm();
    }
  };

  // Handle adding a note
  const handleAddNote = async () => {
    if (!newNote.title || !newNote.content) return;

    setIsLoading(true);
    try {
      const success = await onAddNote(newNote);
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          handleSheetOpenChange(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (newTag && !newNote.tags.includes(newTag)) {
      setNewNote({
        ...newNote,
        tags: [...newNote.tags, newTag],
      });
      setNewTag("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setNewNote({
      ...newNote,
      tags: newNote.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <Sheet
      open={isOpen !== undefined ? isOpen : isSheetOpen}
      onOpenChange={handleSheetOpenChange}
    >
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add New Note</SheetTitle>
          <SheetDescription>
            Create a new note with title, content, and optional tags.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              ref={titleInputRef}
              value={newNote.title}
              onChange={(e) =>
                setNewNote({ ...newNote, title: e.target.value })
              }
              placeholder="Note title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={newNote.content}
              onChange={(e) =>
                setNewNote({ ...newNote, content: e.target.value })
              }
              placeholder="Write your note here..."
              className="min-h-[150px]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddTag}
                disabled={isLoading || !newTag.trim()}
              >
                Add
              </Button>
            </div>
            {newNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newNote.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <SheetFooter>
          <Button
            onClick={handleAddNote}
            disabled={isLoading || !newNote.title || !newNote.content}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding Note...
              </>
            ) : success ? (
              <>
                <CircleCheckBig className="h-4 w-4" />
                Note Added!
              </>
            ) : (
              <>Add Note</>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
