"use client";

import { useState, useEffect } from "react";
import { Notepad } from "@/components/modules/Notepad";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/supabase";

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    fetchNotes();
    setIsCreating(false);
    setSelectedNote(null);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setSelectedNote(null);
  };

  if (isLoading) {
    return <div>Loading notes...</div>;
  }

  if (isCreating || selectedNote) {
    return (
      <Notepad
        initialNote={selectedNote || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Notes</h2>
        <Button onClick={() => setIsCreating(true)}>New Note</Button>
      </div>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            No notes yet. Create your first note!
          </Card>
        ) : (
          notes.map((note) => (
            <Card
              key={note.id}
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setSelectedNote(note)}
            >
              <p className="line-clamp-2">{note.content}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Last updated: {new Date(note.updated_at).toLocaleDateString()}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
