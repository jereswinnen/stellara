"use client";

import { AuthProvider, useAuth } from "@/components/providers/AuthProvider";
import { TagsProvider } from "@/components/providers/TagsProvider";

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TagsProviderWithAuth>{children}</TagsProviderWithAuth>
    </AuthProvider>
  );
}

// Helper component to get auth context and pass it to TagsProvider
function TagsProviderWithAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <TagsProvider user={user}>{children}</TagsProvider>;
}
