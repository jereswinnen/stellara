"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User } from "@supabase/supabase-js";
import { fetchAllTags } from "@/lib/tags";

// Type that accepts either a full User object or a simple object with just an id
type UserLike = User | { id: string } | null | undefined;

// Get user ID from either a full User object or a simple object with just an id
function getUserId(user: UserLike): string | null {
  if (!user) return null;
  return user.id || null;
}

// Sample tags for testing
const SAMPLE_TAGS = [
  "react",
  "nextjs",
  "typescript",
  "javascript",
  "webdev",
  "frontend",
  "backend",
  "database",
  "api",
  "ui",
  "ux",
  "design",
  "css",
  "html",
  "node",
  "express",
  "supabase",
  "prisma",
  "tailwind",
];

// Define the context type
type TagsContextType = {
  allTags: string[];
  loading: boolean;
  error: Error | null;
  refreshTags: () => Promise<void>;
  tagExists: (tag: string) => boolean;
  getTagSuggestions: (
    input: string,
    currentTags: string[],
    maxSuggestions?: number
  ) => string[];
  addTag: (tag: string) => void;
};

// Create the context with a default value
const TagsContext = createContext<TagsContextType>({
  allTags: [],
  loading: false,
  error: null,
  refreshTags: async () => {},
  tagExists: () => false,
  getTagSuggestions: () => [],
  addTag: () => {},
});

export function TagsProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: UserLike;
}) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Update userId when user changes
  useEffect(() => {
    const newUserId = getUserId(user);
    if (newUserId !== userId) {
      console.log(
        `TagsProvider: User ID changed from ${userId} to ${newUserId}`
      );
      setUserId(newUserId);
    }
  }, [user, userId]);

  // Function to fetch tags
  const fetchTags = useCallback(async (userId: string | null) => {
    setLoading(true);
    setError(null);

    try {
      if (userId) {
        console.log(`TagsProvider: Fetching tags for user ${userId}`);
        const tags = await fetchAllTags(userId);

        if (tags && tags.length > 0) {
          setAllTags(tags);
        } else {
          console.log("TagsProvider: No tags found, using sample tags");
          setAllTags(SAMPLE_TAGS);
        }
      } else {
        console.log("TagsProvider: No user ID, using sample tags");
        setAllTags(SAMPLE_TAGS);
      }
    } catch (err) {
      console.error("TagsProvider: Error fetching tags:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setAllTags(SAMPLE_TAGS); // Fallback to sample tags on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to refresh tags
  const refreshTags = useCallback(async () => {
    await fetchTags(userId);
  }, [fetchTags, userId]);

  // Fetch tags when userId changes
  useEffect(() => {
    fetchTags(userId);
  }, [userId, fetchTags]);

  // Check if a tag exists (case-insensitive)
  const tagExists = useCallback(
    (tag: string): boolean => {
      return allTags.some(
        (existingTag) => existingTag.toLowerCase() === tag.toLowerCase()
      );
    },
    [allTags]
  );

  // Get tag suggestions based on input
  const getTagSuggestions = useCallback(
    (
      input: string,
      currentTags: string[],
      maxSuggestions: number = 5
    ): string[] => {
      if (!input.trim()) return [];

      const inputLower = input.toLowerCase();
      return allTags
        .filter(
          (tag) =>
            tag.toLowerCase().includes(inputLower) &&
            !currentTags.some((t) => t.toLowerCase() === tag.toLowerCase())
        )
        .sort((a, b) => {
          // Sort exact matches first, then by alphabetical order
          const aStartsWith = a.toLowerCase().startsWith(inputLower);
          const bStartsWith = b.toLowerCase().startsWith(inputLower);

          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return a.localeCompare(b);
        })
        .slice(0, maxSuggestions);
    },
    [allTags]
  );

  // Add a new tag to the global tags list
  const addTag = useCallback(
    (tag: string) => {
      if (!tag.trim()) return;

      // Check if tag already exists (case-insensitive)
      if (tagExists(tag)) return;

      console.log(`TagsProvider: Adding new tag "${tag}" to global tags list`);
      setAllTags((prev) => {
        const newTags = [...prev, tag].sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );
        return newTags;
      });
    },
    [tagExists]
  );

  // Create the context value
  const contextValue: TagsContextType = {
    allTags,
    loading,
    error,
    refreshTags,
    tagExists,
    getTagSuggestions,
    addTag,
  };

  return (
    <TagsContext.Provider value={contextValue}>{children}</TagsContext.Provider>
  );
}

// Custom hook to use the tags context
export function useTags() {
  const context = useContext(TagsContext);
  if (context === undefined) {
    throw new Error("useTags must be used within a TagsProvider");
  }
  return context;
}

// For backward compatibility with useGlobalTags
export function useGlobalTags(user?: UserLike) {
  const {
    allTags,
    loading,
    error,
    refreshTags,
    tagExists,
    getTagSuggestions,
    addTag,
  } = useTags();

  // Update user ID in the context
  useEffect(() => {
    if (user?.id) {
      console.log(`useGlobalTags: User ID changed to ${user.id}`);
      // This is a no-op now as the TagsProvider handles the user ID
    }
  }, [user?.id]);

  return {
    allTags,
    loading,
    error,
    refreshTags,
    tagExists,
    getTagSuggestions,
    addTag,
  };
}
