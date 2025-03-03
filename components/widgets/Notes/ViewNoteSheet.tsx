"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Note } from "@/lib/supabase";
import { UpdateNoteData } from "@/hooks/useNotes";
import { Trash2Icon, CircleCheckBig, PlusIcon, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editedNote, setEditedNote] = useState<UpdateNoteData>({
    id: note.id,
    content: note.content,
    tags: note.tags || [],
  });
  const [newTag, setNewTag] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when note prop changes
  useEffect(() => {
    setEditedNote({
      id: note.id,
      content: note.content,
      tags: note.tags || [],
    });
    setHasChanges(false);
    setSaveSuccess(false);
  }, [note]);

  // Check for changes when editedNote changes
  useEffect(() => {
    // Skip the initial render
    if (!note) return;

    const tagsChanged =
      JSON.stringify(editedNote.tags) !== JSON.stringify(note.tags || []);

    const hasChanged = editedNote.content !== note.content || tagsChanged;

    setHasChanges(hasChanged);
  }, [editedNote, note]);

  // Handle sheet open/close
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      // Reset form to original values when closing without saving
      setEditedNote({
        id: note.id,
        content: note.content,
        tags: note.tags || [],
      });
      setNewTag("");
      setHasChanges(false);
      setSaveSuccess(false);
    }
  };

  // Handle saving note changes
  const handleSaveChanges = async () => {
    if (!editedNote.content.trim()) return;

    setIsLoading(true);
    setSaveSuccess(false);

    try {
      const success = await onUpdateNote(editedNote);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => {
          setIsSheetOpen(false);
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a note
  const handleDeleteNote = async () => {
    setIsDeleting(true);
    try {
      const success = await onDeleteNote(note.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        setIsSheetOpen(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (!newTag.trim() || editedNote.tags?.includes(newTag.trim())) return;

    setEditedNote({
      ...editedNote,
      tags: [...(editedNote.tags || []), newTag.trim()],
    });
    setNewTag("");
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setEditedNote({
      ...editedNote,
      tags: editedNote.tags?.filter((tag) => tag !== tagToRemove),
    });
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
          >
            View
          </Button>
        )}

        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Note</SheetTitle>
          </SheetHeader>

          <div className="px-4 py-4 space-y-4">
            <Textarea
              value={editedNote.content}
              onChange={(e) =>
                setEditedNote({ ...editedNote, content: e.target.value })
              }
              className="min-h-[200px]"
              disabled={isLoading || isDeleting}
            />

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
              {editedNote.tags && editedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {editedNote.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        className="h-3 w-3 inline-flex items-center justify-center rounded-full focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(tag);
                        }}
                        aria-label={`Remove ${tag} tag`}
                        disabled={isLoading || isDeleting}
                      >
                        <X className="h-3 w-3 cursor-pointer" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="flex flex-row">
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isLoading || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2Icon className="h-4 w-4" />
                  Delete Note
                </>
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveChanges}
              disabled={
                isLoading ||
                isDeleting ||
                !editedNote.content.trim() ||
                !hasChanges
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <CircleCheckBig className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <CircleCheckBig className="h-4 w-4" />
                  Save Changes
                </>
              )}
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
              This action cannot be undone. This will permanently delete your
              note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
