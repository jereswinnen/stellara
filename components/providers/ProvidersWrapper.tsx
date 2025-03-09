"use client";

import { AuthProvider, useAuth } from "@/components/providers/AuthProvider";
import { TagsProvider } from "@/components/providers/TagsProvider";
import { UserPreferencesProvider } from "@/components/providers/UserPreferencesProvider";
import { AudioPlayerProvider } from "@/components/providers/AudioPlayerProvider";
import { AudioPlayer } from "@/components/AudioPlayer";

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NestedProviders>{children}</NestedProviders>
    </AuthProvider>
  );
}

// Helper component to get auth context and pass it to nested providers
function NestedProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <TagsProvider user={user}>
      <UserPreferencesProvider>
        <AudioPlayerProvider>
          <>
            {children}
            <AudioPlayer />
          </>
        </AudioPlayerProvider>
      </UserPreferencesProvider>
    </TagsProvider>
  );
}
