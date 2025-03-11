"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useArticles } from "@/hooks/useArticles";
import { supabase, Article } from "@/lib/supabase";
import { AddArticleSheet } from "@/components/global/sheets/AddArticleSheet";
import { articleEvents } from "@/components/widgets/Articles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { extractDomain, formatReadingTime } from "@/lib/utils";
import {
  BookOpenIcon,
  PlusIcon,
  Loader2,
  StarIcon,
  ArchiveIcon,
  SearchIcon,
  FilterIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpdateArticleData } from "@/hooks/useArticles";
import { ArticleActions } from "@/components/global/ArticleActions";

export default function ArticlesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { articles, loading, addArticle, fetchArticles } = useArticles(user);
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  // Listen for article list refresh events
  useEffect(() => {
    const unsubscribe = articleEvents.subscribe(() => {
      // Only fetch if we don't already have articles or if they need to be refreshed
      if (!articles.length || articles.length === 0) {
        fetchArticles();
      }
    });

    return unsubscribe;
  }, [fetchArticles, articles]);

  // Filter articles based on search query and filters
  useEffect(() => {
    if (!articles) {
      setFilteredArticles([]);
      return;
    }

    let filtered = [...articles];

    // Apply archive filter
    if (!showArchived) {
      filtered = filtered.filter((article) => !article.is_archive);
    }

    // Apply favorites filter
    if (showFavorites) {
      filtered = filtered.filter((article) => article.is_favorite);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.url.toLowerCase().includes(query) ||
          (article.tags &&
            article.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    setFilteredArticles(filtered);
  }, [articles, searchQuery, showArchived, showFavorites]);

  // Handle adding an article
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

  const updateArticle = async (articleData: UpdateArticleData) => {
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
  const navigateToArticle = (articleId: string) => {
    router.push(`/articles/${articleId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold">Articles</h1>
          <Button onClick={() => setIsAddArticleOpen(true)}>
            <PlusIcon className="size-4" />
            Add Article
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FilterIcon className="h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={showFavorites}
                onCheckedChange={setShowFavorites}
              >
                Favorites Only
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showArchived}
                onCheckedChange={setShowArchived}
              >
                Show Archived
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {loading ? (
          <div className="flex gap-2 items-center justify-center">
            <Loader2 className="size-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading articles...</p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="flex gap-3 border rounded-md p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigateToArticle(article.id)}
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
                    <h3 className="font-medium line-clamp-1">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                      {article.is_favorite && (
                        <StarIcon className="size-4 text-yellow-500" />
                      )}
                      {article.is_archive && (
                        <ArchiveIcon className="size-4 text-blue-500" />
                      )}
                    </div>
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
            <BookOpenIcon className="size-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "No articles match your search"
                : "No articles saved yet"}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddArticleOpen(true)}
              >
                <PlusIcon className="size-4 mr-2" />
                Add your first article
              </Button>
            )}
          </div>
        )}
      </div>

      <AddArticleSheet
        onAddArticle={handleAddArticle}
        isOpen={isAddArticleOpen}
        onOpenChange={setIsAddArticleOpen}
      />
    </div>
  );
}
