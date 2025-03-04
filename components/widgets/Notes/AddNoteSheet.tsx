"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { MarkdownEditor } from "@/components/global/MarkdownEditor";

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
  const [newNote, setNewNote] = useState<NewNoteData>({
    title: "",
    content: "",
    tags: [],
  });
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen_, setIsOpen_] = useState(false);

  // Use controlled or uncontrolled state based on props
  const isSheetOpen = isOpen !== undefined ? isOpen : isOpen_;
  const setIsSheetOpen = onOpenChange || setIsOpen_;

  const resetForm = () => {
    setNewNote({
      title: "",
      content: "",
      tags: [],
    });
    setNewTag("");
    setIsLoading(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      resetForm();
    }
    setIsSheetOpen(open);
  };

  const handleAddNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await onAddNote({
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags,
      });

      if (success) {
        handleSheetOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim() || newNote.tags.includes(newTag.trim())) {
      return;
    }
    setNewNote({
      ...newNote,
      tags: [...newNote.tags, newTag.trim()],
    });
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewNote({
      ...newNote,
      tags: newNote.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New Note</SheetTitle>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newNote.title}
              onChange={(e) =>
                setNewNote({ ...newNote, title: e.target.value })
              }
              placeholder="Note title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <MarkdownEditor
              value={newNote.content}
              onChange={(value) => setNewNote({ ...newNote, content: value })}
              placeholder="Write your note here..."
              minHeight="150px"
              disabled={isLoading}
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
              <div className="flex flex-wrap gap-1 mt-2">
                {newNote.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 p-0"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleAddNote}
            disabled={
              isLoading || !newNote.title.trim() || !newNote.content.trim()
            }
            className="mt-4"
          >
            {isLoading ? "Adding..." : "Add Note"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
