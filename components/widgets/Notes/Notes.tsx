"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { useNotes, CreateNoteData } from "@/hooks/useNotes";
import { ViewNoteSheet } from "@/components/widgets/Notes/ViewNoteSheet";
import { AddNoteSheet } from "@/components/widgets/Notes/AddNoteSheet";
import { PlusIcon } from "lucide-react";

export function Notes() {
  const { user } = useAuth();
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes(user);
  const [isAddNoteSheetOpen, setIsAddNoteSheetOpen] = useState(false);
  const [quickNoteContent, setQuickNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      }
    } catch (error) {
      console.error("Error saving quick note:", error);
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
        content: noteData.content,
        tags: noteData.tags.length > 0 ? noteData.tags : undefined,
      });
      return success;
    } catch (error) {
      console.error("Error saving note:", error);
      return false;
    }
  };

  if (loading) {
    return <div>Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold">Notepad</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddNoteSheetOpen(true)}
            className="h-8 px-2"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            New Note
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Write a quick note..."
                value={quickNoteContent}
                onChange={(e) => setQuickNoteContent(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleQuickNoteSave}
                  disabled={isSaving || !quickNoteContent.trim()}
                >
                  {isSaving ? "Saving..." : "Save Quick Note"}
                </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h2 className="text-xs font-medium uppercase text-muted-foreground">
                Recent Notes
              </h2>
              {notes.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No notes yet. Create your first note above!
                </p>
              ) : (
                <ul className="space-y-2">
                  {notes.map((note) => (
                    <ViewNoteSheet
                      key={note.id}
                      note={note}
                      onUpdateNote={updateNote}
                      onDeleteNote={deleteNote}
                      trigger={
                        <li className="p-2 flex flex-col gap-1 cursor-pointer hover:bg-accent transition-colors rounded">
                          <p className="line-clamp-2">{note.content}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {note.tags &&
                                note.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-1.5 py-0.5 bg-secondary rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(note.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </li>
                      }
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AddNoteSheet
        onAddNote={handleNewNoteSave}
        isOpen={isAddNoteSheetOpen}
        onOpenChange={setIsAddNoteSheetOpen}
      />
    </div>
  );
}
