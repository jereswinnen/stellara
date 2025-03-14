"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase, Article } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserPreferences } from "@/components/providers/UserPreferencesProvider";
import { useReaderBackground } from "@/hooks/preferences/useReaderBackground";
import {
  Loader2,
  SquareArrowOutUpRight,
  ChevronLeft,
  ArrowLeft,
  BookOpen,
  Glasses,
  Clock,
  RefreshCw,
} from "lucide-react";
import { UpdateArticleData } from "@/hooks/useArticles";
import { articleEvents } from "@/components/widgets/Articles";
import { formatReadingTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { ViewArticleSheet } from "@/components/global/sheets/ViewArticleSheet";
import { ArticleActions } from "@/components/global/ArticleActions";
import { fetchArticleContent } from "@/lib/articleContent";

export default function ArticleDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { preferences, updatePreference } = useUserPreferences();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditSheet, setShowEditSheet] = useState(false);

  useReaderBackground();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!user || !id) return;

      if (!article || article.id !== id) {
        setLoading(true);
      }

      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching article:", error);
          router.push("/articles");
          return;
        }

        setArticle(data);
      } catch (error) {
        console.error("Error fetching article:", error);
        router.push("/articles");
      } finally {
        setLoading(false);
      }
    };

    if (user && (!article || article.id !== id)) {
      fetchArticle();
    }
  }, [id, user, router, article]);

  const updateArticle = async (articleData: UpdateArticleData) => {
    if (!user || !article) return false;

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

      // Update the local article state
      setArticle({ ...article, ...articleData });

      // Notify other components to refresh
      articleEvents.emit();

      return true;
    } catch (error) {
      console.error("Error updating article:", error);
      return false;
    }
  };

  const handleDelete = async () => {
    if (!user || !article) return false;

    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", article.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting article:", error);
        return false;
      }

      // Notify other components to refresh
      articleEvents.emit();

      // Navigate back to articles page
      router.push("/articles");
      return true;
    } catch (error) {
      console.error("Error deleting article:", error);
      return false;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <BookOpen className="size-16 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Article not found</h1>
        <Button onClick={() => router.push("/articles")}>
          <ArrowLeft className="size-4" />
          Back to Articles
        </Button>
      </div>
    );
  }

  return (
    <div className={`container max-w-3xl mx-auto py-8`}>
      <header className="flex flex-col gap-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => router.push("/articles")}
            >
              <ChevronLeft className="size-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Glasses className="size-4 mr-2" />
                  Reading Mode
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Background Color</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={preferences.readerBackgroundColor}
                  onValueChange={(value) =>
                    updatePreference(
                      "readerBackgroundColor",
                      value as "default" | "green" | "sepia"
                    )
                  }
                >
                  <DropdownMenuRadioItem value="default">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded border mr-2 bg-background"></div>
                      Default
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="green">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded border mr-2 bg-green-50 dark:bg-green-950"></div>
                      Green
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="sepia">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded border mr-2 bg-amber-50 dark:bg-amber-950"></div>
                      Sepia
                    </div>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {article && (
            <ArticleActions
              article={article}
              onUpdateArticle={updateArticle}
              onDeleteArticle={handleDelete}
            />
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            {article?.title}
          </h1>
          {article && article.reading_time_minutes && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-3" />
              <p>{formatReadingTime(article.reading_time_minutes)}</p>
            </div>
          )}
          {/* {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )} */}
        </div>

        {article && (
          <ViewArticleSheet
            article={article}
            onUpdateArticle={updateArticle}
            onDeleteArticle={handleDelete}
            isOpen={showEditSheet}
            onOpenChange={setShowEditSheet}
          />
        )}
      </header>

      {article.body ? (
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="  text-muted-foreground" />
          <p className="text-muted-foreground">
            No content available for this article
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={async () => {
              try {
                setLoading(true);
                const articleContent = await fetchArticleContent(article.url);
                if (articleContent && articleContent.content) {
                  const { data, error } = await supabase
                    .from("articles")
                    .update({ body: articleContent.content })
                    .eq("id", article.id)
                    .eq("user_id", user?.id);

                  if (error) throw error;

                  // Update the article in state
                  setArticle({
                    ...article,
                    body: articleContent.content,
                  });

                  // Show success message
                  alert("Article content has been updated");
                } else {
                  // Show error message
                  alert("Could not extract content from this article");
                }
              } catch (error) {
                console.error("Error refreshing content:", error);
                alert("Failed to refresh article content");
              } finally {
                setLoading(false);
              }
            }}
          >
            <RefreshCw className="size-4" />
            Refresh Content
          </Button>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4"
          >
            <Button>
              <SquareArrowOutUpRight className="size-4" />
              Visit Original Article
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
