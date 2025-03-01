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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          content: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
      reading_list: {
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
    };
    Enums: {
      user_role: "user" | "admin";
      book_status: "Backlog" | "Reading" | "Finished" | "Abandoned";
    };
  };
};
