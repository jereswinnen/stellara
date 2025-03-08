"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { PodcastFeedMetadata } from "@/app/api/podcast-feed/route";
import { PodcastSearchResult } from "@/app/api/podcast-search/route";

export interface PodcastFeed {
  id: string;
  user_id: string;
  feed_url: string;
  title: string;
  author: string;
  description: string;
  artwork_url: string;
  website_url: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface PodcastEpisode {
  id: string;
  feed_id: string;
  user_id: string;
  guid: string;
  title: string;
  description: string;
  audio_url: string;
  published_date: string;
  duration: number;
  image_url: string | null;
  is_played: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  play_position: number;
  created_at: string;
  updated_at: string;
}

export interface NewPodcastFeedData {
  feed_url: string;
}

// Create a simple event emitter for podcast list refresh
export const podcastEvents = {
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

/**
 * Search for podcasts using the iTunes Search API
 * @param term The search term
 * @returns Promise with the search results
 */
export async function searchPodcasts(
  term: string
): Promise<PodcastSearchResult[]> {
  if (!term.trim()) {
    return [];
  }

  try {
    // Call our API endpoint that will handle the actual searching
    const apiUrl = `/api/podcast-search?term=${encodeURIComponent(term)}`;
    console.log(`Calling podcast search API: ${apiUrl}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Search API error: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(`Failed to search podcasts: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Search API response:", data);

    // The API returns { podcasts: [...] }, so we need to extract the podcasts array
    if (data && data.podcasts && Array.isArray(data.podcasts)) {
      return data.podcasts;
    } else {
      console.error("Search API returned unexpected data format:", data);
      return [];
    }
  } catch (error) {
    console.error("Error searching podcasts:", error);
    return [];
  }
}

/**
 * Fetch metadata from a podcast feed URL
 * @param url The podcast feed URL
 * @returns Promise with the metadata
 */
export async function fetchPodcastFeedMetadata(
  url: string
): Promise<PodcastFeedMetadata | null> {
  if (!url.trim()) {
    return null;
  }

  try {
    console.log(`Fetching podcast feed metadata from: ${url}`);

    // Call our API endpoint that will handle the actual fetching
    const response = await fetch(
      `/api/podcast-feed?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch podcast feed: ${response.status} ${response.statusText}`,
        errorText
      );
      return null; // Return null instead of throwing to allow graceful fallback
    }

    const data = await response.json();
    console.log("Podcast feed metadata response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching podcast feed metadata:", error);
    return null;
  }
}

export function usePodcasts(user: User | null) {
  const [feeds, setFeeds] = useState<PodcastFeed[]>([]);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Fetch all podcast feeds for the current user
  const fetchFeeds = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("podcast_feeds")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching podcast feeds:", error);
        return;
      }

      setFeeds(data || []);
    } catch (error) {
      console.error("Error fetching podcast feeds:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all podcast episodes for the current user
  const fetchEpisodes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("podcast_episodes")
        .select("*")
        .eq("user_id", user.id)
        .order("published_date", { ascending: false });

      if (error) {
        console.error("Error fetching podcast episodes:", error);
        return;
      }

      setEpisodes(data || []);
    } catch (error) {
      console.error("Error fetching podcast episodes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new podcast feed
  const addPodcastFeed = async (podcastFeedData: NewPodcastFeedData) => {
    if (!user) return false;
    if (!podcastFeedData.feed_url) return false;

    try {
      // Fetch metadata from the feed URL
      const metadata = await fetchPodcastFeedMetadata(podcastFeedData.feed_url);
      if (!metadata) {
        console.error("Failed to fetch podcast feed metadata");
        return false;
      }

      // Insert the feed into the database
      const { data: insertedFeed, error: feedError } = await supabase
        .from("podcast_feeds")
        .insert({
          user_id: user.id,
          feed_url: podcastFeedData.feed_url,
          title: metadata.title,
          author: metadata.author,
          description: metadata.description,
          artwork_url: metadata.artworkUrl,
          website_url: metadata.websiteUrl,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (feedError || !insertedFeed) {
        console.error("Error adding podcast feed:", feedError);
        return false;
      }

      // Insert episodes from the feed
      if (metadata.episodes && metadata.episodes.length > 0) {
        const episodesToInsert = metadata.episodes.map((episode) => ({
          feed_id: insertedFeed.id,
          user_id: user.id,
          guid: episode.guid,
          title: episode.title,
          description: episode.description,
          audio_url: episode.audioUrl,
          published_date: episode.publishedDate,
          duration: episode.duration,
          image_url: episode.imageUrl || metadata.artworkUrl,
          is_played: false,
          is_favorite: false,
          is_archived: false,
          play_position: 0,
        }));

        const { error: episodesError } = await supabase
          .from("podcast_episodes")
          .insert(episodesToInsert)
          .select();

        if (episodesError) {
          console.error("Error adding podcast episodes:", episodesError);
          // Continue even if episodes fail, we can try again later
        }
      }

      await fetchFeeds();
      await fetchEpisodes();
      podcastEvents.emit();
      return true;
    } catch (error) {
      console.error("Error adding podcast feed:", error);
      return false;
    }
  };

  // Update episode status (played, favorite, archived, position)
  const updateEpisodeStatus = async (
    episodeId: string,
    updates: {
      is_played?: boolean;
      is_favorite?: boolean;
      is_archived?: boolean;
      play_position?: number;
    }
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("podcast_episodes")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", episodeId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating episode status:", error);
        return false;
      }

      await fetchEpisodes();
      return true;
    } catch (error) {
      console.error("Error updating episode status:", error);
      return false;
    }
  };

  // Delete a podcast feed and all its episodes
  const deletePodcastFeed = async (feedId: string) => {
    if (!user) return false;

    try {
      // Episodes will be deleted automatically due to CASCADE
      const { error } = await supabase
        .from("podcast_feeds")
        .delete()
        .eq("id", feedId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting podcast feed:", error);
        return false;
      }

      await fetchFeeds();
      await fetchEpisodes();
      podcastEvents.emit();
      return true;
    } catch (error) {
      console.error("Error deleting podcast feed:", error);
      return false;
    }
  };

  // Refresh a podcast feed to get new episodes
  const refreshPodcastFeed = async (feedId: string) => {
    if (!user) return false;

    try {
      // Get the feed
      const { data: feed, error: feedError } = await supabase
        .from("podcast_feeds")
        .select("*")
        .eq("id", feedId)
        .eq("user_id", user.id)
        .single();

      if (feedError || !feed) {
        console.error("Error getting podcast feed:", feedError);
        return false;
      }

      // Fetch metadata from the feed URL
      const metadata = await fetchPodcastFeedMetadata(feed.feed_url);
      if (!metadata) {
        console.error("Failed to fetch podcast feed metadata");
        return false;
      }

      // Update the feed
      const { error: updateError } = await supabase
        .from("podcast_feeds")
        .update({
          title: metadata.title,
          author: metadata.author,
          description: metadata.description,
          artwork_url: metadata.artworkUrl,
          website_url: metadata.websiteUrl,
          last_updated: new Date().toISOString(),
        })
        .eq("id", feedId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating podcast feed:", updateError);
        return false;
      }

      // Get existing episodes to avoid duplicates
      const { data: existingEpisodes, error: episodesError } = await supabase
        .from("podcast_episodes")
        .select("guid")
        .eq("feed_id", feedId)
        .eq("user_id", user.id);

      if (episodesError) {
        console.error("Error getting existing episodes:", episodesError);
        return false;
      }

      const existingGuids = new Set(
        existingEpisodes.map((episode) => episode.guid)
      );

      // Filter out episodes that already exist
      const newEpisodes = metadata.episodes.filter(
        (episode) => !existingGuids.has(episode.guid)
      );

      if (newEpisodes.length > 0) {
        const episodesToInsert = newEpisodes.map((episode) => ({
          feed_id: feedId,
          user_id: user.id,
          guid: episode.guid,
          title: episode.title,
          description: episode.description,
          audio_url: episode.audioUrl,
          published_date: episode.publishedDate,
          duration: episode.duration,
          image_url: episode.imageUrl || metadata.artworkUrl,
          is_played: false,
          is_favorite: false,
          is_archived: false,
          play_position: 0,
        }));

        const { error: insertError } = await supabase
          .from("podcast_episodes")
          .insert(episodesToInsert);

        if (insertError) {
          console.error("Error adding new episodes:", insertError);
          return false;
        }
      }

      await fetchFeeds();
      await fetchEpisodes();
      podcastEvents.emit();
      return true;
    } catch (error) {
      console.error("Error refreshing podcast feed:", error);
      return false;
    }
  };

  // Initialize feeds and episodes when user changes
  useEffect(() => {
    if (user && (!initialFetchDone.current || userIdRef.current !== user.id)) {
      userIdRef.current = user.id;
      fetchFeeds();
      fetchEpisodes();
      initialFetchDone.current = true;
    }
  }, [user]);

  return {
    feeds,
    episodes,
    loading,
    fetchFeeds,
    fetchEpisodes,
    addPodcastFeed,
    updateEpisodeStatus,
    deletePodcastFeed,
    refreshPodcastFeed,
    recentEpisodes: episodes
      .filter((episode) => !episode.is_archived)
      .slice(0, 10),
  };
}
