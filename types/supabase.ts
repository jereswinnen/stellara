export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          preferences: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          preferences?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          preferences?: Record<string, any> | null;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          content: string;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          tags?: string[] | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          tags?: string[] | null;
          updated_at?: string;
        };
      };
      books: {
        Row: {
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
        Insert: {
          book_title: string;
          author: string;
          book_cover_url?: string;
          started_reading_date?: string;
          finished_reading_date?: string;
          status?: "Backlog" | "Reading" | "Finished" | "Abandoned";
          rating?: number;
          user_id: string;
          created_at?: string;
        };
        Update: {
          book_title?: string;
          author?: string;
          book_cover_url?: string;
          started_reading_date?: string;
          finished_reading_date?: string;
          status?: "Backlog" | "Reading" | "Finished" | "Abandoned";
          rating?: number;
        };
      };
      links: {
        Row: {
          id: string;
          url: string;
          title: string;
          image: string | null;
          tags: string[] | null;
          is_favorite: boolean;
          is_archive: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          url: string;
          title: string;
          image?: string | null;
          tags?: string[] | null;
          is_favorite?: boolean;
          is_archive?: boolean;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          url?: string;
          title?: string;
          image?: string | null;
          tags?: string[] | null;
          is_favorite?: boolean;
          is_archive?: boolean;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          url: string;
          title: string;
          body: string | null;
          image: string | null;
          tags: string[] | null;
          is_favorite: boolean;
          is_archive: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          url: string;
          title: string;
          body?: string | null;
          image?: string | null;
          tags?: string[] | null;
          is_favorite?: boolean;
          is_archive?: boolean;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          url?: string;
          title?: string;
          body?: string | null;
          image?: string | null;
          tags?: string[] | null;
          is_favorite?: boolean;
          is_archive?: boolean;
          updated_at?: string;
        };
      };
    };
    Enums: {
      user_role: "user" | "admin";
      book_status: "Backlog" | "Reading" | "Finished" | "Abandoned";
    };
  };
};
