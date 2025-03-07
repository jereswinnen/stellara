"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";

// Define the preferences type
export type UserPreferences = {
  readerBackgroundColor: "default" | "green" | "sepia";
};

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  readerBackgroundColor: "default",
};

// Define the context type
type UserPreferencesContextType = {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => Promise<void>;
};

// Create the context
const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

// Provider component
export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences when user changes
  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        setPreferences(DEFAULT_PREFERENCES);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("preferences")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading preferences:", error);
          setPreferences(DEFAULT_PREFERENCES);
        } else {
          // Merge saved preferences with defaults
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...(data.preferences as UserPreferences),
          });
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, [user]);

  // Update a preference
  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!user) return;

    // Update local state immediately for responsive UI
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));

    try {
      // Get current preferences from database
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        console.error("Error fetching current preferences:", fetchError);
        return;
      }

      // Merge current preferences with the new value
      const updatedPreferences = {
        ...(userData.preferences || {}),
        [key]: value,
      };

      // Update in database
      const { error: updateError } = await supabase
        .from("users")
        .update({ preferences: updatedPreferences })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating preferences:", updateError);
        // Revert local state if update failed
        setPreferences((prev) => ({
          ...prev,
          [key]: prev[key],
        }));
      }
    } catch (error) {
      console.error("Error updating preference:", error);
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{ preferences, isLoading, updatePreference }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

// Hook to use the preferences context
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    );
  }
  return context;
}
