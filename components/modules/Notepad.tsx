"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/supabase";
import { ChangeEvent } from "react";

interface NotepadProps {
  initialNote?: Note;
  onSave?: () => void;
  onCancel?: () => void;
}

export function Notepad({ initialNote, onSave, onCancel }: NotepadProps) {
  const [content, setContent] = useState(initialNote?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const user = await supabase.auth.getUser();

      if (!user.data.user) {
        throw new Error("You must be logged in to save notes");
      }

      if (initialNote) {
        // Update existing note
        const { error: updateError } = await supabase
          .from("notes")
          .update({
            content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", initialNote.id)
          .eq("user_id", user.data.user.id);

        if (updateError) throw updateError;
      } else {
        // Create new note
        const { error: insertError } = await supabase.from("notes").insert([
          {
            content,
            user_id: user.data.user.id,
          },
        ]);

        if (insertError) throw insertError;
      }

      onSave?.();
      if (!initialNote) {
        setContent(""); // Clear content only for new notes
      }
    } catch (error) {
      console.error("Error saving note:", error);
      setError(error instanceof Error ? error.message : "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialNote) return;

    try {
      const user = await supabase.auth.getUser();

      if (!user.data.user) {
        throw new Error("You must be logged in to delete notes");
      }

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", initialNote.id)
        .eq("user_id", user.data.user.id);

      if (error) throw error;
      onCancel?.();
    } catch (error) {
      console.error("Error deleting note:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete note"
      );
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="pt-6">
        <Textarea
          placeholder="Write your note here..."
          value={content}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setContent(e.target.value)
          }
          className="min-h-[200px] resize-none"
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {initialNote && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSaving}
          >
            Remove
          </Button>
        )}
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !content.trim()}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
}
