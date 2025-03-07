"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { useNotes, CreateNoteData } from "@/hooks/useNotes";
import { ViewNoteSheet } from "@/components/global/sheets/ViewNoteSheet";
import { AddNoteSheet } from "@/components/global/sheets/AddNoteSheet";
import { MarkdownEditor } from "@/components/global/MarkdownEditor";
import { MarkdownContent } from "@/components/global/MarkdownContent";
import { Loader2, PlusIcon, CheckCircle2 } from "lucide-react";
import { Note } from "@/lib/supabase";
import { noteListEvents } from "@/components/providers/CommandMenuProvider";

export function Notes() {
  const { user } = useAuth();
  const { notes, loading, createNote, updateNote, deleteNote, fetchNotes } =
    useNotes(user);
  const [isAddNoteSheetOpen, setIsAddNoteSheetOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isViewNoteOpen, setIsViewNoteOpen] = useState(false);
  const [quickNoteContent, setQuickNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Listen for note list refresh events
  useEffect(() => {
    // Subscribe to note list refresh events
    const unsubscribe = noteListEvents.subscribe(() => {
      fetchNotes();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [fetchNotes]);

  const handleQuickNoteSave = async () => {
    if (!quickNoteContent.trim()) return;
    setIsSaving(true);
    setSuccess(false);

    try {
      const success = await createNote({
        content: quickNoteContent,
        tags: [],
      });
      if (success) {
        setQuickNoteContent("");
        // Notify all components that need to refresh their note lists
        noteListEvents.emit();
        setSuccess(true);

        // Reset success state after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewNoteSave = async (noteData: {
    title: string;
    content: string;
    tags: string[];
  }) => {
    try {
      const success = await createNote({
        content: `# ${noteData.title}\n\n${noteData.content}`,
        tags: noteData.tags,
      });

      if (success) {
        // Notify all components that need to refresh their note lists
        noteListEvents.emit();

        // Close the sheet after successful add
        setIsAddNoteSheetOpen(false);
      }

      return success;
    } catch (error) {
      console.error("Error saving note:", error);
      return false;
    }
  };

  // Handle updating a note
  const handleUpdateNote = async (noteData: any) => {
    const success = await updateNote(noteData);

    if (success) {
      // Notify all components that need to refresh their note lists
      noteListEvents.emit();

      // Close the sheet after successful update
      setIsViewNoteOpen(false);
    }

    return success;
  };

  // Handle deleting a note
  const handleDeleteNote = async (noteId: string) => {
    const success = await deleteNote(noteId);

    if (success) {
      // Notify all components that need to refresh their note lists
      noteListEvents.emit();

      // Close the sheet after successful delete
      setIsViewNoteOpen(false);
    }

    return success;
  };

  // Open the view note sheet
  const openViewNoteSheet = (note: Note) => {
    setSelectedNote(note);
    setIsViewNoteOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Notes</CardTitle>
        <Button
          size="icon"
          className="size-8"
          onClick={() => setIsAddNoteSheetOpen(true)}
        >
          <PlusIcon className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <MarkdownEditor
            value={quickNoteContent}
            onChange={setQuickNoteContent}
            placeholder="Write a quick note..."
            minHeight="100px"
          />
          <Button
            onClick={handleQuickNoteSave}
            disabled={isSaving || !quickNoteContent.trim() || success}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Adding Quick Note...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="size-4" />
                Quick Note Added!
              </>
            ) : (
              <>Add Quick Note</>
            )}
          </Button>
        </div>

        <Separator />

        <div className="space-y-4">
          {loading ? (
            <div className="flex gap-2 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 !pt-1 gap-2 cursor-pointer rounded-md border hover:bg-accent/50 transition-colors"
                  onClick={() => openViewNoteSheet(note)}
                >
                  <div className="grow line-clamp-2 text-sm">
                    <MarkdownContent content={note.content} />
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.updated_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <AddNoteSheet
        onAddNote={handleNewNoteSave}
        isOpen={isAddNoteSheetOpen}
        onOpenChange={setIsAddNoteSheetOpen}
      />

      {selectedNote && (
        <ViewNoteSheet
          note={selectedNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          isOpen={isViewNoteOpen}
          onOpenChange={setIsViewNoteOpen}
        />
      )}
    </Card>
  );
}
