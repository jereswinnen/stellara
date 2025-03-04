"use client";

import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { X, Trash2 } from "lucide-react";
import { Note } from "@/lib/supabase";
import { UpdateNoteData } from "@/hooks/useNotes";
import { MarkdownEditor } from "@/components/global/MarkdownEditor";

interface ViewNoteSheetProps {
  note: Note;
  onUpdateNote: (noteData: UpdateNoteData) => Promise<boolean>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function ViewNoteSheet({
  note,
  onUpdateNote,
  onDeleteNote,
  trigger,
}: ViewNoteSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedNote, setEditedNote] = useState({
    content: note.content,
    tags: note.tags || [],
  });
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if there are changes
  const checkForChanges = (updatedNote = editedNote) => {
    const contentChanged = updatedNote.content !== note.content;
    const tagsChanged =
      JSON.stringify(updatedNote.tags) !== JSON.stringify(note.tags || []);
    return contentChanged || tagsChanged;
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to original content when closing
      setEditedNote({
        content: note.content,
        tags: note.tags || [],
      });
      setNewTag("");
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
        setHasChanges(false);
        //onOpenChange?.(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    setIsDeleting(true);
    try {
      const success = await onDeleteNote(note.id);
      if (success) {
        setShowDeleteConfirm(false);
        setIsOpen(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim() || editedNote.tags.includes(newTag.trim())) {
      return;
    }
    const updatedNote = {
      ...editedNote,
      tags: [...editedNote.tags, newTag.trim()],
    };
    setEditedNote(updatedNote);
    setNewTag("");
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
        <SheetTrigger asChild>
          {trigger || <Button variant="outline">View Note</Button>}
        </SheetTrigger>

        <SheetContent>
          <SheetHeader>
            <SheetTitle>View Note</SheetTitle>
          </SheetHeader>

          <div className="px-4 py-4 space-y-4">
            {/* Editor section */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <MarkdownEditor
                value={editedNote.content}
                onChange={handleContentChange}
                className="min-h-[200px]"
                disabled={isLoading || isDeleting}
              />
            </div>

            {/* Tags section */}
            <div className="space-y-2">
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
                  disabled={isLoading || isDeleting}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={isLoading || isDeleting || !newTag.trim()}
                >
                  Add
                </Button>
              </div>

              {editedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {editedNote.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 p-0"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isLoading || isDeleting}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
