"use client";

import { useEffect } from "react";
import { useUserPreferences } from "@/components/providers/UserPreferencesProvider";

export function useReaderBackground() {
  const { preferences } = useUserPreferences();

  useEffect(() => {
    // First, remove any existing background classes
    document.body.classList.remove(
      "bg-background",
      "bg-green-50",
      "dark:bg-green-950",
      "bg-amber-50",
      "dark:bg-amber-950"
    );

    // Then add the appropriate classes based on user preference
    switch (preferences.readerBackgroundColor) {
      case "green":
        document.body.classList.add("bg-green-50", "dark:bg-green-950");
        break;
      case "sepia":
        document.body.classList.add("bg-amber-50", "dark:bg-amber-950");
        break;
      default:
        document.body.classList.add("bg-background");
    }

    // Cleanup function to reset body background when component unmounts
    return () => {
      document.body.classList.remove(
        "bg-background",
        "bg-green-50",
        "dark:bg-green-950",
        "bg-amber-50",
        "dark:bg-amber-950"
      );
      // Set it back to the default background
      document.body.classList.add("bg-background");
    };
  }, [preferences.readerBackgroundColor]); // Only re-run when background preference changes
}
