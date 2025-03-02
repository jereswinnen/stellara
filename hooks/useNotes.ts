import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export interface CreateNoteData {
  content: string;
}

export interface UpdateNoteData {
  id: string;
  content: string;
}

export function useNotes(user: User | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotes();
    } else {
      setNotes([]);
      setLoading(false);
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

      const { error } = await supabase
        .from("notes")
        .update({
          content: noteData.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteData.id)
        .eq("user_id", user.id);

      if (error) throw error;
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
  };
}
