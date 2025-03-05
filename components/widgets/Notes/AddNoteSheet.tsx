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
import { TagInput } from "@/components/global/TagInput";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTags } from "@/components/providers/TagsProvider";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen_, setIsOpen_] = useState(false);

  // Use controlled or uncontrolled state based on props
  const isSheetOpen = isOpen !== undefined ? isOpen : isOpen_;
  const setIsSheetOpen = onOpenChange || setIsOpen_;

  // Get the current user
  const { user } = useAuth();

  // Get all existing tags from the Tags context
  const { allTags, addTag } = useTags();

  const resetForm = () => {
    setNewNote({
      title: "",
      content: "",
      tags: [],
    });
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

  const handleAddTag = (tag: string) => {
    // Add to the global tags list if it's a new tag
    addTag(tag);

    setNewNote({
      ...newNote,
      tags: [...newNote.tags, tag],
    });
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

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagInput
              tags={newNote.tags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              existingTags={allTags}
              disabled={isLoading}
              placeholder="Add a tag (type to see suggestions)"
            />
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
