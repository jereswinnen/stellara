"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { fetchAllTags } from "@/lib/tags";

// Sample tags for testing
const SAMPLE_TAGS = [
  "JavaScript",
  "React",
  "NextJS",
  "TypeScript",
  "CSS",
  "HTML",
  "Design",
  "UI/UX",
  "Backend",
  "Frontend",
  "Database",
  "API",
  "Books",
  "Articles",
  "Notes",
  "Links",
  "Productivity",
  "Learning",
  "Career",
  "Personal",
];

// Type that accepts either a full User object or a simple object with just an id
type UserLike = User | { id: string } | null | undefined;

// Get user ID from either a full User object or a simple object with just an id
function getUserId(user: UserLike): string | null {
  if (!user) return null;
  return user.id || null;
}

// Optional user parameter for testing without authentication
export function useGlobalTags(user?: UserLike) {
  const [allTags, setAllTags] = useState<string[]>(SAMPLE_TAGS);
  const [loading, setLoading] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  // For debugging
  const componentId = useRef(
    `useGlobalTags-${Math.random().toString(36).substring(2, 9)}`
  );

  // Store the user ID in a ref to use as a stable dependency
  const userIdRef = useRef<string | null>(null);

  // Update the user ID ref when the user changes
  useEffect(() => {
    userIdRef.current = getUserId(user);
  }, [user]);

  // Fetch tags only when the user ID changes
  useEffect(() => {
    const userId = userIdRef.current;

    console.log(
      `[${componentId.current}] useEffect triggered with userId: ${userId}`
    );

    // If no user, use sample tags
    if (!userId) {
      console.log(`[${componentId.current}] No user ID, using sample tags`);
      setAllTags(SAMPLE_TAGS);
      return;
    }

    // Skip if the user ID hasn't changed
    if (lastUserIdRef.current === userId) {
      console.log(
        `[${componentId.current}] User ID unchanged (${userId}), skipping fetch`
      );
      return;
    }

    // Update the last user ID
    console.log(
      `[${componentId.current}] User ID changed from ${lastUserIdRef.current} to ${userId}, fetching tags`
    );
    lastUserIdRef.current = userId;

    // Fetch tags
    const fetchTagsForUser = async () => {
      try {
        setLoading(true);
        console.log(
          `[${componentId.current}] Starting tag fetch for user ${userId}`
        );
        const tags = await fetchAllTags(userId);

        if (tags.length > 0) {
          console.log(
            `[${componentId.current}] Setting ${tags.length} tags from API`
          );
          setAllTags(tags);
        } else {
          // Fallback to sample tags if no tags found
          console.log(
            `[${componentId.current}] No tags found, using sample tags`
          );
          setAllTags(SAMPLE_TAGS);
        }
      } catch (error) {
        console.error(`[${componentId.current}] Error fetching tags:`, error);
        setAllTags(SAMPLE_TAGS);
      } finally {
        setLoading(false);
      }
    };

    fetchTagsForUser();
  }, [userIdRef.current]); // Use the ref as a dependency

  // Manual refresh function
  const refreshTags = useCallback(async () => {
    const userId = userIdRef.current;

    if (!userId) {
      console.log(
        `[${componentId.current}] refreshTags: No user ID, using sample tags`
      );
      setAllTags(SAMPLE_TAGS);
      return;
    }

    try {
      setLoading(true);
      console.log(
        `[${componentId.current}] refreshTags: Fetching tags for user ${userId}`
      );
      const tags = await fetchAllTags(userId);

      if (tags.length > 0) {
        console.log(
          `[${componentId.current}] refreshTags: Setting ${tags.length} tags from API`
        );
        setAllTags(tags);
      } else {
        console.log(
          `[${componentId.current}] refreshTags: No tags found, using sample tags`
        );
        setAllTags(SAMPLE_TAGS);
      }
    } catch (error) {
      console.error(`[${componentId.current}] refreshTags: Error:`, error);
      setAllTags(SAMPLE_TAGS);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since we use the ref

  // Check if a tag exists (case-insensitive)
  const tagExists = useCallback(
    (tag: string): boolean => {
      if (!tag) return false;
      return allTags.some(
        (existingTag) => existingTag.toLowerCase() === tag.toLowerCase()
      );
    },
    [allTags]
  );

  // Get tag suggestions based on input
  const getTagSuggestions = useCallback(
    (input: string, currentTags: string[] = []): string[] => {
      if (!input) return [];

      const inputLower = input.toLowerCase();
      return allTags
        .filter(
          (tag) =>
            // Only include tags that:
            // 1. Match the input (case insensitive)
            // 2. Are not already in the currentTags list
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
        });
    },
    [allTags]
  );

  return {
    allTags,
    loading,
    refreshTags,
    tagExists,
    getTagSuggestions,
  };
}
