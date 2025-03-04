import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export interface CreateNoteData {
  content: string;
  tags?: string[];
}

export interface UpdateNoteData {
  id: string;
  content: string;
  tags?: string[];
}

export function useNotes(user: User | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (user && !initialized.current) {
      fetchNotes();
      initialized.current = true;
    } else if (!user) {
      setNotes([]);
      setLoading(false);
      initialized.current = false;
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (noteData: CreateNoteData): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error("You must be logged in to save notes");
      }

      const { error } = await supabase.from("notes").insert([
        {
          content: noteData.content,
          tags: noteData.tags || null,
          user_id: user.id,
        },
      ]);

      if (error) throw error;
      await fetchNotes();
      return true;
    } catch (error) {
      console.error("Error saving note:", error);
      return false;
    }
  };

  const updateNote = async (noteData: UpdateNoteData): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error("You must be logged in to update notes");
      }

      const updates: any = {};

      // Only include fields that are provided
      if (noteData.content !== undefined) updates.content = noteData.content;
      if (noteData.tags !== undefined) updates.tags = noteData.tags;
      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("notes")
        .update(updates)
        .eq("id", noteData.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating note:", error);
        throw error;
      }

      await fetchNotes();
      return true;
    } catch (error) {
      console.error("Error updating note:", error);
      return false;
    }
  };

  const deleteNote = async (noteId: string): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error("You must be logged in to delete notes");
      }

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchNotes();
      return true;
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    }
  };

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    fetchNotes,
  };
}
