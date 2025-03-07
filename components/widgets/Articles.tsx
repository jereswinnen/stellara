"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenIcon, PlusIcon, Loader2 } from "lucide-react";
import { AddArticleSheet } from "@/components/global/sheets/AddArticleSheet";
import { useArticles } from "@/hooks/useArticles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Article } from "@/lib/supabase";
import { extractDomain, formatReadingTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ArticleActions } from "@/components/global/ArticleActions";
import { supabase } from "@/lib/supabase";

// Create a simple event emitter for articles refresh
export const articleEvents = {
  listeners: new Set<() => void>(),

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  },

  emit() {
    this.listeners.forEach((callback) => callback());
  },
};

export function Articles() {
  const { user } = useAuth();
  const router = useRouter();
  const { loading, recentArticles, addArticle, fetchArticles } =
    useArticles(user);
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);

  // Listen for article list refresh events
  useEffect(() => {
    // Subscribe to article list refresh events
    const unsubscribe = articleEvents.subscribe(() => {
      fetchArticles();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [fetchArticles]);

  const handleAddArticle = async (articleData: any) => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .insert([{ ...articleData, user_id: user?.id }])
        .select();

      if (error) {
        console.error("Error adding article:", error);
        return false;
      }

      // Refresh articles
      fetchArticles();
      return true;
    } catch (error) {
      console.error("Error adding article:", error);
      return false;
    }
  };

  const updateArticle = async (articleData: any) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("articles")
        .update(articleData)
        .eq("id", articleData.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating article:", error);
        return false;
      }

      // Refresh articles
      fetchArticles();
      return true;
    } catch (error) {
      console.error("Error updating article:", error);
      return false;
    }
  };

  const deleteArticle = async (articleId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting article:", error);
        return false;
      }

      // Refresh articles
      fetchArticles();
      return true;
    } catch (error) {
      console.error("Error deleting article:", error);
      return false;
    }
  };

  // Navigate to article detail page
  const navigateToArticlePage = (article: Article) => {
    router.push(`/articles/${article.id}`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Recent Articles</CardTitle>
        <Button
          size="sm"
          className="size-8"
          onClick={() => setIsAddArticleOpen(true)}
        >
          <PlusIcon className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex gap-2 items-center justify-center">
            <Loader2 className="size-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading articles...</p>
          </div>
        ) : recentArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentArticles.slice(0, 6).map((article) => (
              <div
                key={article.id}
                className="flex gap-3 border rounded-md p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigateToArticlePage(article)}
              >
                {article.image && (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="flex-shrink-0 size-10 object-cover rounded"
                  />
                )}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium line-clamp-1">
                      {article.title}
                    </p>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground line-clamp-1">
                    <p>{extractDomain(article.url)}</p>
                    {article.reading_time_minutes && (
                      <>
                        <span className="text-muted-foreground">&bull;</span>
                        <p>{formatReadingTime(article.reading_time_minutes)}</p>
                      </>
                    )}
                  </div>
                </div>

                <ArticleActions
                  article={article}
                  onUpdateArticle={updateArticle}
                  onDeleteArticle={deleteArticle}
                  triggerVariant="icon"
                  align="end"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center justify-center h-40 text-center">
            <BookOpenIcon className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">No articles saved yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddArticleOpen(true)}
            >
              <PlusIcon className="size-4" />
              Add your first article
            </Button>
          </div>
        )}

        <AddArticleSheet
          onAddArticle={handleAddArticle}
          isOpen={isAddArticleOpen}
          onOpenChange={setIsAddArticleOpen}
        />
      </CardContent>
    </Card>
  );
}
