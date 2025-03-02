"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenIcon, PlusIcon, ExternalLinkIcon } from "lucide-react";
import { AddArticleSheet } from "@/components/widgets/Articles/AddArticleSheet";
import { ViewArticleSheet } from "@/components/widgets/Articles/ViewArticleSheet";
import { useArticles } from "@/hooks/useArticles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Article } from "@/lib/supabase";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Articles</CardTitle>
        <Button
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsAddArticleOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading articles...</p>
          </div>
        ) : recentArticles.length > 0 ? (
          <div className="space-y-3">
            {recentArticles.map((article) => (
              <div
                key={article.id}
                className="flex items-start space-x-3 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => openViewArticleSheet(article)}
              >
                <div className="flex-shrink-0 mt-1">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted flex items-center justify-center rounded">
                      <BookOpenIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
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
                            <ExternalLinkIcon className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open article</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {article.url}
                  </p>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
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
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <BookOpenIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No articles saved yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIsAddArticleOpen(true)}
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              Add your first article
            </Button>
          </div>
        )}

        {/* AddArticleSheet - always render it once, controlled by isAddArticleOpen */}
        <AddArticleSheet
          onAddArticle={handleAddArticle}
          isOpen={isAddArticleOpen}
          onOpenChange={setIsAddArticleOpen}
        />

        {/* ViewArticleSheet - only render when an article is selected */}
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
