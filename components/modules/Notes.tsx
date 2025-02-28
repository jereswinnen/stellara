"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
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
      setIsLoading(false);
    }
  };

  const handleNewNoteSave = async () => {
    if (!newNoteContent.trim()) return;
    setIsSaving(true);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error("You must be logged in to save notes");
      }

      const { error } = await supabase.from("notes").insert([
        {
          content: newNoteContent,
          user_id: user.data.user.id,
        },
      ]);

      if (error) throw error;
      setNewNoteContent("");
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditNoteSave = async () => {
    if (!selectedNote || !editedContent.trim()) return;
    setIsSaving(true);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error("You must be logged in to save notes");
      }

      const { error } = await supabase
        .from("notes")
        .update({
          content: editedContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedNote.id)
        .eq("user_id", user.data.user.id);

      if (error) throw error;
      fetchNotes();
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error("You must be logged in to delete notes");
      }

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", selectedNote.id)
        .eq("user_id", user.data.user.id);

      if (error) throw error;
      fetchNotes();
      setIsDeleteDialogOpen(false);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const openNoteInDrawer = (note: Note) => {
    setSelectedNote(note);
    setEditedContent(note.content);
    setIsDrawerOpen(true);
  };

  if (isLoading) {
    return <div>Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Notepad</CardTitle>
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
                  {notes.map((note, index) => (
                    <li
                      key={note.id}
                      className="p-1 flex gap-3 items-center justify-between text-sm cursor-pointer hover:bg-accent transition-colors rounded"
                      onClick={() => openNoteInDrawer(note)}
                    >
                      <p className="line-clamp-1">{note.content}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Note</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <DrawerFooter className="sm:flex-row sm:justify-between">
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Note</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your note.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteNote}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="flex gap-2">
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
              <Button onClick={handleEditNoteSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
