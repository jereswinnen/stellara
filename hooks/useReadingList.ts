"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, ReadingListItem } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export type BookStatus = "Backlog" | "Reading" | "Finished" | "Abandoned";

export interface NewBookData {
  book_title: string;
  author: string;
  book_cover_url: string;
  status: BookStatus;
  rating?: number;
}

export function useReadingList(user: User | null) {
  const [books, setBooks] = useState<ReadingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Fetch all books for the current user
  const fetchBooks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reading_list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching books:", error);
        return;
      }

      setBooks(data || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new book to the reading list
  const addBook = async (bookData: NewBookData) => {
    if (!user) return false;
    if (!bookData.book_title || !bookData.author) return false;

    try {
      const { error } = await supabase.from("reading_list").insert({
        book_title: bookData.book_title,
        author: bookData.author,
        book_cover_url: bookData.book_cover_url || null,
        status: bookData.status,
        rating: bookData.rating,
        user_id: user.id,
        started_reading_date:
          bookData.status === "Reading" ? new Date().toISOString() : null,
        finished_reading_date:
          bookData.status === "Finished" ? new Date().toISOString() : null,
      });

      if (error) {
        console.error("Error adding book:", error);
        return false;
      }

      await fetchBooks();
      return true;
    } catch (error) {
      console.error("Error adding book:", error);
      return false;
    }
  };

  // Get books with a specific status
  const getBooksByStatus = (status: BookStatus) => {
    return books.filter((book) => book.status === status);
  };

  // Initialize books when user changes
  useEffect(() => {
    if (user && (!initialFetchDone.current || userIdRef.current !== user.id)) {
      userIdRef.current = user.id;
      fetchBooks();
      initialFetchDone.current = true;
    }
  }, [user]);

  return {
    books,
    loading,
    fetchBooks,
    addBook,
    getBooksByStatus,
    currentlyReadingBooks: getBooksByStatus("Reading"),
  };
}
