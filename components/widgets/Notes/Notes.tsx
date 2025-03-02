"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { useNotes } from "@/hooks/useNotes";
import { ViewNoteSheet } from "@/components/widgets/Notes/ViewNoteSheet";

export function Notes() {
  const { user } = useAuth();
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes(user);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleNewNoteSave = async () => {
    if (!newNoteContent.trim()) return;
    setIsSaving(true);

    try {
      const success = await createNote({ content: newNoteContent });
      if (success) {
        setNewNoteContent("");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div>Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Notepad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Write a new note..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleNewNoteSave}
                  disabled={isSaving || !newNoteContent.trim()}
                >
                  {isSaving ? "Saving..." : "Save Note"}
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
                        <li className="p-1 flex gap-3 items-center justify-between text-sm cursor-pointer hover:bg-accent transition-colors rounded">
                          <p className="line-clamp-1">{note.content}</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(note.created_at), {
                              addSuffix: true,
                            })}
                          </p>
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
    </div>
  );
}
