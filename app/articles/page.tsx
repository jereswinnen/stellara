"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Articles } from "@/components/widgets/Articles/Articles";

export default function ArticlesPage() {
  const { user, loading } = useAuth();
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
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Articles</h1>
        <p className="text-muted-foreground">
          Browse and manage your saved articles
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <Articles />
      </div>
    </div>
  );
}
