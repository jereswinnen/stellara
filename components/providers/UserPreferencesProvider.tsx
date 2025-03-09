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
  audioPlayerPreferences: {
    forwardSkipSeconds: number;
    backwardSkipSeconds: number;
    playbackSpeed: number;
  };
};

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  readerBackgroundColor: "default",
  audioPlayerPreferences: {
    forwardSkipSeconds: 30,
    backwardSkipSeconds: 15,
    playbackSpeed: 1.0,
  },
};

// Define the context type
type UserPreferencesContextType = {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => Promise<void>;
  updateAudioPlayerPreference: <
    K extends keyof UserPreferences["audioPlayerPreferences"]
  >(
    key: K,
    value: UserPreferences["audioPlayerPreferences"][K]
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

  // Load preferences from database
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(DEFAULT_PREFERENCES);
      setIsLoading(false);
    }
  }, [user]);

  // Load user preferences from the database
  async function loadPreferences() {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading preferences:", error);
        setPreferences(DEFAULT_PREFERENCES);
        return;
      }

      if (data && data.preferences) {
        // Merge with default preferences to ensure all fields exist
        const mergedPreferences = {
          ...DEFAULT_PREFERENCES,
          ...data.preferences,
          // Ensure nested objects are properly merged
          audioPlayerPreferences: {
            ...DEFAULT_PREFERENCES.audioPlayerPreferences,
            ...(data.preferences.audioPlayerPreferences || {}),
          },
        };
        setPreferences(mergedPreferences);
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  }

  // Update a specific preference
  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!user) return;

    try {
      // Update local state
      const updatedPreferences = {
        ...preferences,
        [key]: value,
      };
      setPreferences(updatedPreferences);

      // Update in database
      const { error } = await supabase
        .from("users")
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating preferences:", error);
        // Revert on error
        setPreferences(preferences);
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Revert on error
      setPreferences(preferences);
    }
  };

  // Update a specific audio player preference
  const updateAudioPlayerPreference = async <
    K extends keyof UserPreferences["audioPlayerPreferences"]
  >(
    key: K,
    value: UserPreferences["audioPlayerPreferences"][K]
  ) => {
    if (!user) return;

    try {
      // Update local state
      const updatedAudioPreferences = {
        ...preferences.audioPlayerPreferences,
        [key]: value,
      };

      const updatedPreferences = {
        ...preferences,
        audioPlayerPreferences: updatedAudioPreferences,
      };

      setPreferences(updatedPreferences);

      // Update in database
      const { error } = await supabase
        .from("users")
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating audio preferences:", error);
        // Revert on error
        setPreferences(preferences);
      }
    } catch (error) {
      console.error("Error updating audio preferences:", error);
      // Revert on error
      setPreferences(preferences);
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        updatePreference,
        updateAudioPlayerPreference,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

// Custom hook to use the preferences context
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    );
  }
  return context;
}

// Custom hook specifically for audio player preferences
export function useAudioPlayerPreferences() {
  const { preferences, updateAudioPlayerPreference } = useUserPreferences();

  return {
    audioPreferences: preferences.audioPlayerPreferences,
    updateAudioPreference: updateAudioPlayerPreference,
  };
}
