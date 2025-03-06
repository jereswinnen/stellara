"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpenIcon,
  PlusIcon,
  SquareArrowOutUpRight,
  Loader2,
  ClockIcon,
} from "lucide-react";
import { AddArticleSheet } from "@/components/global/Sheets/AddArticleSheet";
import { ViewArticleSheet } from "@/components/global/Sheets/ViewArticleSheet";
import { useArticles } from "@/hooks/useArticles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Article } from "@/lib/supabase";
import { extractDomain, formatReadingTime } from "@/lib/utils";
import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip,
} from "@/components/ui/tooltip";

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
  const {
    loading,
    recentArticles,
    addArticle,
    updateArticle,
    deleteArticle,
    fetchArticles,
  } = useArticles(user);
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isViewArticleOpen, setIsViewArticleOpen] = useState(false);

  // Listen for article list refresh events
  useEffect(() => {
    // Subscribe to article list refresh events
    const unsubscribe = articleEvents.subscribe(() => {
      fetchArticles();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [fetchArticles]);

  // Handle adding an article
  const handleAddArticle = async (articleData: any) => {
    const success = await addArticle(articleData);

    if (success) {
      // Notify all components that need to refresh their article lists
      articleEvents.emit();

      // Close the sheet after successful add
      setIsAddArticleOpen(false);
    }

    return success;
  };

  // Handle updating an article
  const handleUpdateArticle = async (articleData: any) => {
    const success = await updateArticle(articleData);

    if (success) {
      // Notify all components that need to refresh their article lists
      articleEvents.emit();

      // Close the sheet after successful update
      setIsViewArticleOpen(false);
    }

    return success;
  };

  // Handle deleting an article
  const handleDeleteArticle = async (articleId: string) => {
    const success = await deleteArticle(articleId);

    if (success) {
      // Notify all components that need to refresh their article lists
      articleEvents.emit();

      // Close the sheet after successful delete
      setIsViewArticleOpen(false);
    }

    return success;
  };

  // Open the view article sheet
  const openViewArticleSheet = (article: Article) => {
    setSelectedArticle(article);
    setIsViewArticleOpen(true);
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
            {recentArticles.map((article) => (
              <div
                key={article.id}
                className="flex gap-3 border rounded-md p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => openViewArticleSheet(article)}
              >
                <div className="flex-shrink-0">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="size-10 object-cover rounded"
                    />
                  ) : (
                    <div className="size-10 bg-muted flex items-center justify-center rounded">
                      <BookOpenIcon className="size-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-col">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium line-clamp-1">
                        {article.title}
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0"
                            >
                              <SquareArrowOutUpRight className="size-4 text-muted-foreground hover:text-primary" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open article</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {extractDomain(article.url)}
                      </p>
                      {article.reading_time_minutes && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ClockIcon className="size-3" />
                          <span>
                            {formatReadingTime(article.reading_time_minutes)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center justify-center h-40 text-center">
            <BookOpenIcon className="size-8 text-muted-foreground mb-2" />
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

        {selectedArticle && (
          <ViewArticleSheet
            article={selectedArticle}
            onUpdateArticle={handleUpdateArticle}
            onDeleteArticle={handleDeleteArticle}
            isOpen={isViewArticleOpen}
            onOpenChange={setIsViewArticleOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}
