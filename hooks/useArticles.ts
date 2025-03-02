"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, Article } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { fetchUrlMetadata } from "@/lib/urlMetadata";
import { fetchArticleContent } from "@/lib/articleContent";

export interface NewArticleData {
  url: string;
  title?: string;
  image?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_archive?: boolean;
}

export interface UpdateArticleData {
  id: string;
  url?: string;
  title?: string;
  image?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_archive?: boolean;
}

export function useArticles(user: User | null) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Fetch all articles for the current user
  const fetchArticles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching articles:", error);
        return;
      }

      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new article
  const addArticle = async (articleData: NewArticleData) => {
    if (!user) return false;
    if (!articleData.url) return false;

    try {
      // If title is not provided, fetch metadata from URL
      if (!articleData.title) {
        const metadata = await fetchUrlMetadata(articleData.url);
        if (metadata) {
          articleData.title = metadata.title;
          articleData.image = metadata.image;
        }
      }

      // Fetch article content
      const articleContent = await fetchArticleContent(articleData.url);

      const { error } = await supabase.from("articles").insert({
        url: articleData.url,
        title: articleData.title || "Untitled",
        image: articleData.image || null,
        body: articleContent?.content || null,
        tags: articleData.tags || [],
        is_favorite: articleData.is_favorite || false,
        is_archive: articleData.is_archive || false,
        user_id: user.id,
      });

      if (error) {
        console.error("Error adding article:", error);
        return false;
      }

      await fetchArticles();
      return true;
    } catch (error) {
      console.error("Error adding article:", error);
      return false;
    }
  };

  // Update an existing article
  const updateArticle = async (articleData: UpdateArticleData) => {
    if (!user || !articleData.id) return false;

    try {
      const updates: any = {};

      // Only include fields that are provided
      if (articleData.url !== undefined) updates.url = articleData.url;
      if (articleData.title !== undefined) updates.title = articleData.title;
      if (articleData.image !== undefined) updates.image = articleData.image;
      if (articleData.tags !== undefined) updates.tags = articleData.tags;
      if (articleData.is_favorite !== undefined)
        updates.is_favorite = articleData.is_favorite;
      if (articleData.is_archive !== undefined)
        updates.is_archive = articleData.is_archive;

      const { error } = await supabase
        .from("articles")
        .update(updates)
        .eq("id", articleData.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating article:", error);
        return false;
      }

      await fetchArticles();
      return true;
    } catch (error) {
      console.error("Error updating article:", error);
      return false;
    }
  };

  // Delete an article
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

      await fetchArticles();
      return true;
    } catch (error) {
      console.error("Error deleting article:", error);
      return false;
    }
  };

  // Initialize articles when user changes
  useEffect(() => {
    if (user && (!initialFetchDone.current || userIdRef.current !== user.id)) {
      userIdRef.current = user.id;
      fetchArticles();
      initialFetchDone.current = true;
    }
  }, [user]);

  return {
    articles,
    loading,
    fetchArticles,
    addArticle,
    updateArticle,
    deleteArticle,
    recentArticles: articles
      .filter((article) => !article.is_archive)
      .slice(0, 5), // Get the 5 most recent non-archived articles
  };
}
