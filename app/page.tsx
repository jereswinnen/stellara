"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateTime } from "@/components/modules/DateTime";
import { Notes } from "@/components/modules/Notes";
import { useAuth } from "@/lib/auth-context";
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
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* DateTime Module */}
        <div className="h-[200px]">
          <DateTime />
        </div>

        {/* Notes Module */}
        <div className="lg:col-span-2">
          <Notes />
        </div>
      </div>
    </div>
  );
}
