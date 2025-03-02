"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Trash2Icon, CircleCheckBig } from "lucide-react";

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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);

  // Update local state when note prop changes
  useEffect(() => {
    if (note) {
      setEditedContent(note.content);
    }
  }, [note]);

  // Handle sheet open/close
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      // Reset form to original values when closing without saving
      setEditedContent(note.content);
    }
  };

  // Check if any changes have been made
  const hasChanges = () => {
    return editedContent !== note.content;
  };

  // Handle saving note changes
  const handleSaveChanges = async () => {
    if (!editedContent.trim()) return;

    setIsSaving(true);
    try {
      const success = await onUpdateNote({
        id: note.id,
        content: editedContent,
      });
      if (success) {
        setIsSheetOpen(false);
      }
    } finally {
      setIsSaving(false);
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

          <div className="px-4 py-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>

          <SheetFooter className="flex flex-row">
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isSaving || isDeleting}
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              Delete Note
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveChanges}
              disabled={
                isSaving || isDeleting || !editedContent.trim() || !hasChanges()
              }
            >
              <CircleCheckBig className="h-4 w-4 mr-2" />
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
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
