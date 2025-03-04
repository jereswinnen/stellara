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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X, Loader2, Trash2Icon } from "lucide-react";
import { Note } from "@/lib/supabase";
import { UpdateNoteData } from "@/hooks/useNotes";
import { MarkdownEditor } from "@/components/global/MarkdownEditor";

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
    content: note.content,
    tags: note.tags || [],
  });
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
                disabled={isLoading}
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
                  disabled={isLoading}
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
                        disabled={isLoading}
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
              {/* <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button> */}
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

      {/* <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
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
      </AlertDialog> */}
    </>
  );
}
