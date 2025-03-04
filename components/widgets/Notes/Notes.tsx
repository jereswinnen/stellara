"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { useNotes, CreateNoteData } from "@/hooks/useNotes";
import { ViewNoteSheet } from "@/components/widgets/Notes/ViewNoteSheet";
import { AddNoteSheet } from "@/components/widgets/Notes/AddNoteSheet";
import { MarkdownEditor } from "@/components/global/MarkdownEditor";
import { MarkdownContent } from "@/components/global/MarkdownContent";
import { PlusIcon } from "lucide-react";
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

    try {
      const success = await createNote({
        content: quickNoteContent,
        tags: [],
      });
      if (success) {
        setQuickNoteContent("");
        // Notify all components that need to refresh their note lists
        noteListEvents.emit();
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
    <Card className="col-span-1 row-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Notes</CardTitle>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsAddNoteSheetOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <MarkdownEditor
            value={quickNoteContent}
            onChange={setQuickNoteContent}
            placeholder="Write a quick note..."
            minHeight="100px"
          />
          <Button
            onClick={handleQuickNoteSave}
            disabled={isSaving || !quickNoteContent.trim()}
            className="w-full"
            size="sm"
          >
            {isSaving ? "Saving..." : "Save Note"}
          </Button>
        </div>

        <Separator />

        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="cursor-pointer space-y-1 rounded-md border p-3 hover:bg-accent"
                onClick={() => openViewNoteSheet(note)}
              >
                <div className="line-clamp-3 text-sm">
                  <MarkdownContent content={note.content} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(note.updated_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* AddNoteSheet - always render it once, controlled by isAddNoteSheetOpen */}
      <AddNoteSheet
        onAddNote={handleNewNoteSave}
        isOpen={isAddNoteSheetOpen}
        onOpenChange={setIsAddNoteSheetOpen}
      />

      {/* ViewNoteSheet - only render when a note is selected */}
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
