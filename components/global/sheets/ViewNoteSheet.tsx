"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X, Loader2, Trash2Icon } from "lucide-react";
import { Note } from "@/lib/supabase";
import { UpdateNoteData } from "@/hooks/useNotes";
import { MarkdownEditor } from "@/components/global/MarkdownEditor";
import { TagInput } from "@/components/global/TagInput";
import { useTags } from "@/components/providers/TagsProvider";

interface ViewNoteSheetProps {
  note: Note;
  onUpdateNote: (noteData: UpdateNoteData) => Promise<boolean>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ViewNoteSheet({
  note,
  onUpdateNote,
  onDeleteNote,
  isOpen,
  onOpenChange,
  trigger,
}: ViewNoteSheetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editedNote, setEditedNote] = useState({
    ...note,
    tags: note.tags || [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update editedNote when the note prop changes
  useEffect(() => {
    setEditedNote({
      ...note,
      tags: note.tags || [],
    });
    setHasChanges(false);
  }, [note]);

  // Create a user object from the note's user_id
  const userObj = note?.user_id ? { id: note.user_id } : null;

  // Get all existing tags from the Tags context
  const { allTags, addTag } = useTags();

  // Check if there are changes
  const checkForChanges = (updatedNote = editedNote) => {
    const contentChanged = updatedNote.content !== note.content;
    const tagsChanged =
      JSON.stringify(updatedNote.tags) !== JSON.stringify(note.tags || []);
    return contentChanged || tagsChanged;
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    onOpenChange?.(open);

    if (!open) {
      // Reset to original content when closing
      setEditedNote({
        ...note,
        tags: note.tags || [],
      });
      setHasChanges(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!editedNote.content.trim()) return;
    setIsLoading(true);

    try {
      const success = await onUpdateNote({
        id: note.id,
        content: editedNote.content,
        tags: editedNote.tags,
      });

      if (success) {
        //setHasChanges(false);
        onOpenChange?.(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    setIsLoading(true);
    try {
      const success = await onDeleteNote(note.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        onOpenChange?.(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = (tag: string) => {
    // Add to the global tags list if it's a new tag
    addTag(tag);

    const updatedNote = {
      ...editedNote,
      tags: [...editedNote.tags, tag],
    };
    setEditedNote(updatedNote);
    setHasChanges(checkForChanges(updatedNote));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedNote = {
      ...editedNote,
      tags: editedNote.tags.filter((tag) => tag !== tagToRemove),
    };
    setEditedNote(updatedNote);
    setHasChanges(checkForChanges(updatedNote));
  };

  const handleContentChange = (content: string) => {
    const updatedNote = { ...editedNote, content };
    setEditedNote(updatedNote);
    setHasChanges(checkForChanges(updatedNote));
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="min-w-screen md:min-w-auto md:max-w-2xl overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border">
            <SheetTitle>View Note</SheetTitle>
          </SheetHeader>

          <div className="px-4 space-y-4">
            {/* Editor section */}
            <MarkdownEditor
              value={editedNote.content}
              onChange={handleContentChange}
              className="min-h-[200px]"
              disabled={isLoading}
            />

            {/* Tags section */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <TagInput
                tags={editedNote.tags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                existingTags={allTags}
                disabled={isLoading}
                placeholder="Add a tag (type to see suggestions)"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-between mt-4">
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isLoading}>
                    <Trash2Icon className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this note. This action cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteNote}
                      disabled={isLoading}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={handleSaveChanges}
                disabled={
                  isLoading || !hasChanges || !editedNote.content.trim()
                }
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
