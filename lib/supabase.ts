import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export type Note = {
  id: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type BookItem = {
  id: string;
  book_title: string;
  author: string;
  book_cover_url?: string;
  started_reading_date?: string;
  finished_reading_date?: string;
  status: "Backlog" | "Reading" | "Finished" | "Abandoned";
  rating?: number;
  created_at: string;
  user_id: string;
};

export type Link = {
  id: string;
  url: string;
  title: string;
  image?: string;
  tags?: string[];
  is_favorite: boolean;
  is_archive: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type Article = {
  id: string;
  url: string;
  title: string;
  body?: string;
  image?: string;
  tags?: string[];
  is_favorite: boolean;
  is_archive: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
};
