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
  is_in_queue: boolean;
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

  // Cache for episode counts to avoid repeated API calls
  const episodeCountCache = useRef<Record<string, number>>({});

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

      // Insert only the latest episode from the feed
      if (metadata.episodes && metadata.episodes.length > 0) {
        // Sort episodes by published date (newest first)
        const sortedEpisodes = [...metadata.episodes].sort(
          (a, b) =>
            new Date(b.publishedDate).getTime() -
            new Date(a.publishedDate).getTime()
        );

        // Get the latest episode
        const latestEpisode = sortedEpisodes[0];

        const episodeToInsert = {
          feed_id: insertedFeed.id,
          user_id: user.id,
          guid: latestEpisode.guid,
          title: latestEpisode.title,
          description: latestEpisode.description,
          audio_url: latestEpisode.audioUrl,
          published_date: latestEpisode.publishedDate,
          duration: latestEpisode.duration,
          image_url: latestEpisode.imageUrl || metadata.artworkUrl,
          is_played: false,
          is_favorite: false,
          is_archived: false,
          is_in_queue: false,
          play_position: 0,
        };

        const { error: episodeError } = await supabase
          .from("podcast_episodes")
          .insert(episodeToInsert)
          .select();

        if (episodeError) {
          console.error("Error adding podcast episode:", episodeError);
          // Continue even if episode insertion fails, we can try again later
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
      is_in_queue?: boolean;
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

  // Get episode count for a podcast feed
  const getEpisodeCountForFeed = async (feedId: string): Promise<number> => {
    if (!user) return 0;

    // Return from cache if available
    if (episodeCountCache.current[feedId] !== undefined) {
      return episodeCountCache.current[feedId];
    }

    try {
      // First, get the feed from the database
      const { data: feed, error: feedError } = await supabase
        .from("podcast_feeds")
        .select("*")
        .eq("id", feedId)
        .eq("user_id", user.id)
        .single();

      if (feedError || !feed) {
        console.error("Error getting podcast feed:", feedError);
        return 0;
      }

      // Fetch metadata from the feed URL to get episode count
      const metadata = await fetchPodcastFeedMetadata(feed.feed_url);
      if (!metadata || !metadata.episodes) {
        console.error("Failed to fetch podcast feed metadata");
        return 0;
      }

      // Store in cache
      const count = metadata.episodes.length;
      episodeCountCache.current[feedId] = count;

      return count;
    } catch (error) {
      console.error("Error getting episode count for feed:", error);
      return 0;
    }
  };

  // Clear episode count cache for a specific feed
  const clearEpisodeCountCache = (feedId: string) => {
    delete episodeCountCache.current[feedId];
  };

  // Clear all episode count cache
  const clearAllEpisodeCountCache = () => {
    episodeCountCache.current = {};
  };

  // Refresh a podcast feed to get the latest episodes
  const refreshPodcastFeed = async (feedId: string) => {
    if (!user) return false;

    try {
      // Get the feed from the database
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

      // Update the feed in the database
      const { error: updateError } = await supabase
        .from("podcast_feeds")
        .update({
          title: metadata.title || feed.title,
          author: metadata.author || feed.author,
          description: metadata.description || feed.description,
          artwork_url: metadata.artworkUrl || feed.artwork_url,
          website_url: metadata.websiteUrl || feed.website_url,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating podcast feed:", updateError);
        return false;
      }

      // Clear the episode count cache for this feed
      clearEpisodeCountCache(feedId);

      // We don't add episodes to the database here anymore
      // Just update the feed metadata and return success

      await fetchFeeds();
      await fetchEpisodes();
      podcastEvents.emit();
      return true;
    } catch (error) {
      console.error("Error refreshing podcast feed:", error);
      return false;
    }
  };

  // Fetch all episodes for a specific podcast feed
  const fetchAllEpisodesForFeed = async (feedId: string) => {
    if (!user) return [];

    console.log(`fetchAllEpisodesForFeed: Starting fetch for feed ${feedId}`);

    try {
      // Get the feed from the database
      const { data: feed, error: feedError } = await supabase
        .from("podcast_feeds")
        .select("*")
        .eq("id", feedId)
        .eq("user_id", user.id)
        .single();

      if (feedError || !feed) {
        console.error("Error getting podcast feed:", feedError);
        return [];
      }

      console.log(
        `fetchAllEpisodesForFeed: Got feed ${feed.title}, fetching metadata`
      );

      // Fetch metadata from the feed URL to get all episodes
      const metadata = await fetchPodcastFeedMetadata(feed.feed_url);
      if (!metadata || !metadata.episodes) {
        console.error("Failed to fetch podcast feed metadata");
        return [];
      }

      console.log(
        `fetchAllEpisodesForFeed: Got metadata with ${metadata.episodes.length} episodes`
      );

      // Get existing episodes from the database
      const { data: existingEpisodes, error: episodesError } = await supabase
        .from("podcast_episodes")
        .select("*")
        .eq("feed_id", feedId)
        .eq("user_id", user.id);

      if (episodesError) {
        console.error("Error getting existing episodes:", episodesError);
        return [];
      }

      console.log(
        `fetchAllEpisodesForFeed: Found ${existingEpisodes.length} existing episodes in database`
      );

      // Create a map of existing episode GUIDs for quick lookup
      const existingEpisodesMap = new Map(
        existingEpisodes.map((episode) => [episode.guid, episode])
      );

      // Create a merged list of episodes from both the database and the feed
      const allEpisodes = metadata.episodes.map((feedEpisode) => {
        // If the episode exists in the database, use that version
        const existingEpisode = existingEpisodesMap.get(feedEpisode.guid);
        if (existingEpisode) {
          return existingEpisode;
        }

        // Otherwise, create a temporary episode object (not stored in the database)
        return {
          id: `temp-${feedEpisode.guid}`, // Temporary ID for UI purposes
          feed_id: feedId,
          user_id: user.id,
          guid: feedEpisode.guid,
          title: feedEpisode.title,
          description: feedEpisode.description,
          audio_url: feedEpisode.audioUrl,
          published_date: feedEpisode.publishedDate,
          duration: feedEpisode.duration,
          image_url: feedEpisode.imageUrl || feed.artwork_url,
          is_played: false,
          is_favorite: false,
          is_archived: false,
          is_in_queue: false,
          play_position: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      const tempEpisodes = allEpisodes.filter((ep) =>
        ep.id.startsWith("temp-")
      ).length;
      console.log(
        `fetchAllEpisodesForFeed: Created merged list with ${allEpisodes.length} episodes (${tempEpisodes} temporary)`
      );

      // Sort episodes by published date (newest first)
      return allEpisodes.sort(
        (a, b) =>
          new Date(b.published_date).getTime() -
          new Date(a.published_date).getTime()
      );
    } catch (error) {
      console.error("Error fetching all episodes for feed:", error);
      return [];
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
    fetchAllEpisodesForFeed,
    getEpisodeCountForFeed,
    clearEpisodeCountCache,
    clearAllEpisodeCountCache,
    // Get inbox episodes (not archived, not in queue, not played)
    inboxEpisodes: episodes
      .filter(
        (episode) =>
          !episode.is_archived && !episode.is_in_queue && !episode.is_played
      )
      .sort(
        (a, b) =>
          new Date(b.published_date).getTime() -
          new Date(a.published_date).getTime()
      ),
    // Get queue episodes
    queueEpisodes: episodes
      .filter((episode) => episode.is_in_queue)
      .sort(
        (a, b) =>
          new Date(b.published_date).getTime() -
          new Date(a.published_date).getTime()
      ),
    // Get favorite episodes
    favoriteEpisodes: episodes
      .filter((episode) => episode.is_favorite)
      .sort(
        (a, b) =>
          new Date(b.published_date).getTime() -
          new Date(a.published_date).getTime()
      ),
    // Get recent episodes for the homepage widget (not archived)
    recentEpisodes: episodes
      .filter((episode) => !episode.is_archived)
      .sort(
        (a, b) =>
          new Date(b.published_date).getTime() -
          new Date(a.published_date).getTime()
      )
      .slice(0, 10),
  };
}
