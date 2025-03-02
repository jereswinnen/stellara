"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { DateTime } from "@/components/widgets/DateTime";
import { Notes } from "@/components/widgets/Notes/Notes";
import { PokemonOfTheDay } from "@/components/widgets/PokemonOfTheDay";
import { OnThisDay } from "@/components/widgets/OnThisDay";
import { ReadingList } from "@/components/widgets/ReadingList/ReadingList";
import { Links } from "@/components/widgets/Links/Links";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.user_metadata.full_name || user.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded hidden md:flex items-center">
              Press
              <kbd className="mx-1 px-1.5 py-0.5 bg-background border rounded">
                ⌘K
              </kbd>
              for commands
            </div>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* DateTime Module */}
        <div className="lg:col-span-1">
          <DateTime />
        </div>

        {/* Notes Module */}
        <div className="lg:col-span-3">
          <Notes />
        </div>

        {/* ReadingList Module */}
        <div className="col-span-full lg:col-span-2">
          <ReadingList />
        </div>

        {/* Links Module */}
        <div className="col-span-full lg:col-span-2">
          <Links />
        </div>

        {/* PokemonOfTheDay Module */}
        <div className="lg:col-span-2">
          <PokemonOfTheDay />
        </div>

        {/* OnThisDay Module */}
        <div className="col-span-full">
          <OnThisDay />
        </div>
      </div>
    </div>
  );
}
