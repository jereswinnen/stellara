"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase, Article } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpenIcon,
  ArrowLeftIcon,
  StarIcon,
  ArchiveIcon,
  Loader2,
  SquareArrowOutUpRight,
} from "lucide-react";
import { UpdateArticleData } from "@/hooks/useArticles";
import { articleEvents } from "@/components/widgets/Articles";

export default function ArticleDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingFavorite, setUpdatingFavorite] = useState(false);
  const [updatingArchive, setUpdatingArchive] = useState(false);

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

  const handleToggleFavorite = async () => {
    if (!article) return;

    try {
      setUpdatingFavorite(true);
      const updatedArticle = {
        id: article.id,
        is_favorite: !article.is_favorite,
      };

      await updateArticle(updatedArticle);
    } finally {
      setUpdatingFavorite(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!article) return;

    try {
      setUpdatingArchive(true);
      const updatedArticle = {
        id: article.id,
        is_archive: !article.is_archive,
      };

      await updateArticle(updatedArticle);
    } finally {
      setUpdatingArchive(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <BookOpenIcon className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Article not found</h1>
        <Button onClick={() => router.push("/articles")}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Articles
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/articles")}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Articles
        </Button>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{article.title}</h1>

            <div className="flex items-center gap-2 mb-4">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <SquareArrowOutUpRight className="h-4 w-4" />
                Visit Original
              </a>
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleFavorite}
              disabled={updatingFavorite || updatingArchive}
              className={article.is_favorite ? "text-yellow-500" : ""}
            >
              {updatingFavorite ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <StarIcon className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleArchive}
              disabled={updatingFavorite || updatingArchive}
              className={article.is_archive ? "text-blue-500" : ""}
            >
              {updatingArchive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArchiveIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {article.body ? (
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpenIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No content available for this article
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4"
          >
            <Button>
              <SquareArrowOutUpRight className="h-4 w-4 mr-2" />
              Visit Original Article
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
