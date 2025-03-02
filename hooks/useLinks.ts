"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, Link } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { fetchUrlMetadata } from "@/lib/urlMetadata";

export interface NewLinkData {
  url: string;
  title?: string;
  image?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_archive?: boolean;
}

export interface UpdateLinkData {
  id: string;
  url?: string;
  title?: string;
  image?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_archive?: boolean;
}

export function useLinks(user: User | null) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Fetch all links for the current user
  const fetchLinks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching links:", error);
        return;
      }

      setLinks(data || []);
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new link
  const addLink = async (linkData: NewLinkData) => {
    if (!user) return false;
    if (!linkData.url) return false;

    try {
      // If title is not provided, fetch metadata from URL
      if (!linkData.title) {
        const metadata = await fetchUrlMetadata(linkData.url);
        if (metadata) {
          linkData.title = metadata.title;
          linkData.image = metadata.image;
        }
      }

      const { error } = await supabase.from("links").insert({
        url: linkData.url,
        title: linkData.title || "Untitled",
        image: linkData.image || null,
        tags: linkData.tags || [],
        is_favorite: linkData.is_favorite || false,
        is_archive: linkData.is_archive || false,
        user_id: user.id,
      });

      if (error) {
        console.error("Error adding link:", error);
        return false;
      }

      await fetchLinks();
      return true;
    } catch (error) {
      console.error("Error adding link:", error);
      return false;
    }
  };

  // Update an existing link
  const updateLink = async (linkData: UpdateLinkData) => {
    if (!user || !linkData.id) return false;

    try {
      const updates: any = {};

      // Only include fields that are provided
      if (linkData.url !== undefined) updates.url = linkData.url;
      if (linkData.title !== undefined) updates.title = linkData.title;
      if (linkData.image !== undefined) updates.image = linkData.image;
      if (linkData.tags !== undefined) updates.tags = linkData.tags;
      if (linkData.is_favorite !== undefined)
        updates.is_favorite = linkData.is_favorite;
      if (linkData.is_archive !== undefined)
        updates.is_archive = linkData.is_archive;

      const { error } = await supabase
        .from("links")
        .update(updates)
        .eq("id", linkData.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating link:", error);
        return false;
      }

      await fetchLinks();
      return true;
    } catch (error) {
      console.error("Error updating link:", error);
      return false;
    }
  };

  // Delete a link
  const deleteLink = async (linkId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", linkId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting link:", error);
        return false;
      }

      await fetchLinks();
      return true;
    } catch (error) {
      console.error("Error deleting link:", error);
      return false;
    }
  };

  // Initialize links when user changes
  useEffect(() => {
    if (user && (!initialFetchDone.current || userIdRef.current !== user.id)) {
      userIdRef.current = user.id;
      fetchLinks();
      initialFetchDone.current = true;
    }
  }, [user]);

  return {
    links,
    loading,
    fetchLinks,
    addLink,
    updateLink,
    deleteLink,
    recentLinks: links.slice(0, 5), // Get the 5 most recent links
  };
}
