"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  StarOff,
  Star,
  ListPlus,
  Archive,
  Pause,
  Play,
  ArchiveX,
  ListX,
} from "lucide-react";
import { PodcastEpisode, PodcastFeed } from "@/hooks/usePodcasts";
import { formatDuration } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface ViewPodcastSheetProps {
  podcast: PodcastFeed | null;
  episodes: PodcastEpisode[];
  currentEpisode: PodcastEpisode | null;
  isLoading: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  handleToggleFavorite: (episode: PodcastEpisode) => void;
  handleToggleArchived: (episode: PodcastEpisode) => void;
  handleToggleQueue: (episode: PodcastEpisode) => void;
  handlePlayEpisode: (episode: PodcastEpisode) => void;
  fetchAllEpisodesForFeed?: (feedId: string) => Promise<PodcastEpisode[]>;
  refreshPodcastFeed?: (feedId: string) => Promise<boolean>;
}

// Define types for tracking episode actions
type ActionType = "favorite" | "queue" | "archive" | "play";

export function ViewPodcastSheet({
  podcast,
  episodes: initialEpisodes,
  currentEpisode,
  isLoading,
  isOpen,
  onOpenChange,
  handleToggleFavorite,
  handleToggleArchived,
  handleToggleQueue,
  handlePlayEpisode,
  fetchAllEpisodesForFeed,
  refreshPodcastFeed,
}: ViewPodcastSheetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>(initialEpisodes);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingEpisodeIds, setProcessingEpisodeIds] = useState<Set<string>>(
    new Set()
  );

  // Track which actions are in progress for each episode
  const [episodeActions, setEpisodeActions] = useState<
    Record<string, ActionType[]>
  >({});

  // Helper to mark an action as starting
  const startAction = (episodeId: string, action: ActionType) => {
    setEpisodeActions((prev) => ({
      ...prev,
      [episodeId]: [...(prev[episodeId] || []), action],
    }));
  };

  // Helper to mark an action as complete
  const endAction = (episodeId: string, action: ActionType) => {
    setEpisodeActions((prev) => ({
      ...prev,
      [episodeId]: (prev[episodeId] || []).filter((a) => a !== action),
    }));
  };

  // Check if an action is in progress
  const isActionInProgress = (
    episodeId: string,
    action: ActionType
  ): boolean => {
    return (episodeActions[episodeId] || []).includes(action);
  };

  // Handle sheet open/close
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    onOpenChange(open);

    // If the sheet is being opened and we have a podcast but no episodes yet,
    // trigger the fetch of all episodes
    if (open && podcast && fetchAllEpisodesForFeed && episodes.length === 0) {
      console.log(
        `ViewPodcastSheet: Sheet opened, triggering fetch for podcast ${podcast.id}`
      );
      setIsLoadingEpisodes(true);
      fetchAllEpisodesForFeed(podcast.id)
        .then((allEpisodes) => {
          console.log(
            `ViewPodcastSheet: Fetched ${allEpisodes.length} episodes for podcast ${podcast.id}`
          );
          setEpisodes(allEpisodes);
        })
        .catch((error) => {
          console.error("Error fetching all episodes:", error);
        })
        .finally(() => {
          setIsLoadingEpisodes(false);
        });
    }
  };

  // Fetch all episodes when the sheet is opened
  useEffect(() => {
    if (isOpen && podcast && fetchAllEpisodesForFeed) {
      console.log(
        `ViewPodcastSheet: Fetching all episodes for podcast ${podcast.id}`
      );
      setIsLoadingEpisodes(true);
      fetchAllEpisodesForFeed(podcast.id)
        .then((allEpisodes) => {
          console.log(
            `ViewPodcastSheet: Fetched ${allEpisodes.length} episodes for podcast ${podcast.id}`
          );
          setEpisodes(allEpisodes);
        })
        .catch((error) => {
          console.error("Error fetching all episodes:", error);
        })
        .finally(() => {
          setIsLoadingEpisodes(false);
        });
    }
  }, [isOpen, podcast, fetchAllEpisodesForFeed]);

  // Update episodes when initialEpisodes changes
  useEffect(() => {
    if (!isLoadingEpisodes && !isOpen) {
      setEpisodes(initialEpisodes);
    }
  }, [initialEpisodes, isLoadingEpisodes, isOpen]);

  // Handle refreshing the podcast feed
  const handleRefresh = async () => {
    if (!podcast || !refreshPodcastFeed || !fetchAllEpisodesForFeed) return;

    setIsRefreshing(true);
    try {
      // Refresh the podcast feed metadata (doesn't add episodes to database)
      await refreshPodcastFeed(podcast.id);

      // Fetch all episodes again after refreshing
      const allEpisodes = await fetchAllEpisodesForFeed(podcast.id);
      setEpisodes(allEpisodes);
    } catch (error) {
      console.error("Error refreshing podcast feed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if an episode is temporary (not in the database)
  const isTemporaryEpisode = (episode: PodcastEpisode): boolean => {
    return episode.id.startsWith("temp-");
  };

  // Add a temporary episode to the database before changing its status
  const addEpisodeToDatabase = async (
    episode: PodcastEpisode,
    updates: {
      is_played?: boolean;
      is_favorite?: boolean;
      is_archived?: boolean;
      is_in_queue?: boolean;
    } = {}
  ): Promise<PodcastEpisode | null> => {
    if (!podcast) return null;

    try {
      // Create a new episode object without the temporary ID
      const { id, created_at, updated_at, ...episodeData } = episode;

      // Insert the episode into the database with the updates
      const { data, error } = await supabase
        .from("podcast_episodes")
        .insert({
          ...episodeData,
          ...updates, // Apply the updates
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding episode to database:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error adding episode to database:", error);
      return null;
    }
  };

  // Handle toggling favorite status with temporary episode support
  const handleToggleFavoriteWithTemp = async (episode: PodcastEpisode) => {
    const episodeId = episode.id;
    setProcessingEpisodeIds((prev) => new Set(prev).add(episodeId));
    startAction(episodeId, "favorite");

    try {
      // If this is a temporary episode, add it to the database first
      if (isTemporaryEpisode(episode)) {
        const dbEpisode = await addEpisodeToDatabase(episode, {
          is_favorite: true, // Set the initial state
        });

        if (dbEpisode) {
          // Update the episodes list with the new database episode
          setEpisodes((prev) =>
            prev.map((ep) => (ep.id === episode.id ? dbEpisode : ep))
          );
        } else {
          // If adding to database failed, don't proceed
          return;
        }
      } else {
        // For existing episodes, just toggle the favorite status
        await handleToggleFavorite(episode);

        // Update the local state to reflect the change
        setEpisodes((prev) =>
          prev.map((ep) =>
            ep.id === episode.id ? { ...ep, is_favorite: !ep.is_favorite } : ep
          )
        );
      }
    } finally {
      setProcessingEpisodeIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeId);
        return newSet;
      });
      endAction(episodeId, "favorite");
    }
  };

  // Handle toggling queue status with temporary episode support
  const handleToggleQueueWithTemp = async (episode: PodcastEpisode) => {
    const episodeId = episode.id;
    setProcessingEpisodeIds((prev) => new Set(prev).add(episodeId));
    startAction(episodeId, "queue");

    try {
      // If this is a temporary episode, add it to the database first
      if (isTemporaryEpisode(episode)) {
        const dbEpisode = await addEpisodeToDatabase(episode, {
          is_in_queue: true, // Set the initial state
        });

        if (dbEpisode) {
          // Update the episodes list with the new database episode
          setEpisodes((prev) =>
            prev.map((ep) => (ep.id === episode.id ? dbEpisode : ep))
          );
        } else {
          // If adding to database failed, don't proceed
          return;
        }
      } else {
        // For existing episodes, just toggle the queue status
        await handleToggleQueue(episode);

        // Update the local state to reflect the change
        setEpisodes((prev) =>
          prev.map((ep) =>
            ep.id === episode.id ? { ...ep, is_in_queue: !ep.is_in_queue } : ep
          )
        );
      }
    } finally {
      setProcessingEpisodeIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeId);
        return newSet;
      });
      endAction(episodeId, "queue");
    }
  };

  // Handle toggling archived status with temporary episode support
  const handleToggleArchivedWithTemp = async (episode: PodcastEpisode) => {
    const episodeId = episode.id;
    setProcessingEpisodeIds((prev) => new Set(prev).add(episodeId));
    startAction(episodeId, "archive");

    try {
      // If this is a temporary episode, add it to the database first
      if (isTemporaryEpisode(episode)) {
        const dbEpisode = await addEpisodeToDatabase(episode, {
          is_archived: true, // Set the initial state
        });

        if (dbEpisode) {
          // Update the episodes list with the new database episode
          setEpisodes((prev) =>
            prev.map((ep) => (ep.id === episode.id ? dbEpisode : ep))
          );
        } else {
          // If adding to database failed, don't proceed
          return;
        }
      } else {
        // For existing episodes, just toggle the archived status
        await handleToggleArchived(episode);

        // Update the local state to reflect the change
        setEpisodes((prev) =>
          prev.map((ep) =>
            ep.id === episode.id ? { ...ep, is_archived: !ep.is_archived } : ep
          )
        );
      }
    } finally {
      setProcessingEpisodeIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeId);
        return newSet;
      });
      endAction(episodeId, "archive");
    }
  };

  // Handle playing an episode with temporary episode support
  const handlePlayEpisodeWithTemp = async (episode: PodcastEpisode) => {
    // Don't show loading for play if it's already playing (which would be a pause action)
    if (currentEpisode?.id === episode.id) {
      await handlePlayEpisode(episode);
      return;
    }

    const episodeId = episode.id;
    setProcessingEpisodeIds((prev) => new Set(prev).add(episodeId));
    startAction(episodeId, "play");

    try {
      // If this is a temporary episode, add it to the database first
      if (isTemporaryEpisode(episode)) {
        const dbEpisode = await addEpisodeToDatabase(episode, {
          is_played: true, // Set it as played immediately
        });

        if (dbEpisode) {
          // Update the episodes list with the new database episode
          setEpisodes((prev) =>
            prev.map((ep) => (ep.id === episode.id ? dbEpisode : ep))
          );

          // Play the database episode
          await handlePlayEpisode(dbEpisode);
        }
      } else {
        // For existing episodes, just play it
        await handlePlayEpisode(episode);
      }
    } finally {
      setProcessingEpisodeIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeId);
        return newSet;
      });
      endAction(episodeId, "play");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="overflow-y-auto">
        {podcast && (
          <>
            <SheetHeader className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border">
              <SheetTitle>Podcast Details</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-3 items-center">
                {podcast.artwork_url && (
                  <img
                    src={podcast.artwork_url}
                    alt={podcast.title}
                    className="size-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-bold line-clamp-1">
                    {podcast.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {podcast.author}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Episodes</h3>
                  {isLoadingEpisodes && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Loading...
                      </span>
                    </div>
                  )}
                </div>

                {episodes.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {isLoadingEpisodes
                      ? "Loading episodes..."
                      : "No episodes found for this podcast."}
                  </div>
                ) : (
                  episodes.map((episode) => {
                    const isProcessing = processingEpisodeIds.has(episode.id);
                    const isTemp = isTemporaryEpisode(episode);
                    const isEpisodePlaying = currentEpisode?.id === episode.id;
                    const isEpisodeLoading = isEpisodePlaying && isLoading;

                    // Check if specific actions are loading
                    const isFavoriteLoading = isActionInProgress(
                      episode.id,
                      "favorite"
                    );
                    const isQueueLoading = isActionInProgress(
                      episode.id,
                      "queue"
                    );
                    const isArchiveLoading = isActionInProgress(
                      episode.id,
                      "archive"
                    );
                    const isPlayLoading = isActionInProgress(
                      episode.id,
                      "play"
                    );

                    return (
                      <div
                        key={episode.id}
                        className="flex flex-col gap-3 border rounded-md p-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex flex-1 flex-col">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium line-clamp-2">
                              {episode.title}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground line-clamp-1">
                              <p>
                                {formatDistanceToNow(
                                  new Date(episode.published_date),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </p>

                              {episode.duration > 0 && (
                                <>
                                  <span className="text-muted-foreground">
                                    &bull;
                                  </span>
                                  <p>{formatDuration(episode.duration)}</p>
                                </>
                              )}

                              {episode.play_position > 0 &&
                                !isEpisodePlaying && (
                                  <>
                                    <span className="text-muted-foreground">
                                      &bull;
                                    </span>
                                    <p>
                                      {Math.floor(
                                        (episode.play_position /
                                          episode.duration) *
                                          100
                                      )}
                                      % played
                                    </p>
                                  </>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <a
                                  className="flex-shrink-0 cursor-pointer"
                                  tabIndex={-1}
                                  onClick={() =>
                                    handlePlayEpisodeWithTemp(episode)
                                  }
                                >
                                  {isEpisodeLoading || isPlayLoading ? (
                                    <Loader2 className="size-4.5 animate-spin" />
                                  ) : isEpisodePlaying ? (
                                    <Pause className="size-4.5" />
                                  ) : (
                                    <Play className="size-4.5" />
                                  )}
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isEpisodePlaying ? (
                                  <p>Pause Episode</p>
                                ) : (
                                  <p>Play Episode</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <a
                                  className="flex-shrink-0 cursor-pointer"
                                  tabIndex={-1}
                                  onClick={() =>
                                    handleToggleFavoriteWithTemp(episode)
                                  }
                                >
                                  {isFavoriteLoading ? (
                                    <Loader2 className="size-4.5 animate-spin text-muted-foreground" />
                                  ) : episode.is_favorite ? (
                                    <StarOff className="size-4.5 text-yellow-500 hover:text-muted-foreground" />
                                  ) : (
                                    <Star className="size-4.5 text-muted-foreground hover:text-yellow-500" />
                                  )}
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                {episode.is_favorite ? (
                                  <p>Unfavorite Episode</p>
                                ) : (
                                  <p>Favorite Episode</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <a
                                  className="flex-shrink-0 cursor-pointer"
                                  tabIndex={-1}
                                  onClick={() =>
                                    handleToggleQueueWithTemp(episode)
                                  }
                                >
                                  {isQueueLoading ? (
                                    <Loader2 className="size-4.5 animate-spin text-muted-foreground" />
                                  ) : episode.is_in_queue ? (
                                    <ListX className="size-4.5 text-blue-500 hover:text-muted-foreground" />
                                  ) : (
                                    <ListPlus className="size-4.5 text-muted-foreground hover:text-blue-500" />
                                  )}
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                {episode.is_in_queue
                                  ? "Remove from Queue"
                                  : "Add to Queue"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <a
                                  className="flex-shrink-0 cursor-pointer"
                                  tabIndex={-1}
                                  onClick={() =>
                                    handleToggleArchivedWithTemp(episode)
                                  }
                                >
                                  {isArchiveLoading ? (
                                    <Loader2 className="size-4.5 animate-spin text-muted-foreground" />
                                  ) : episode.is_archived ? (
                                    <ArchiveX className="size-4.5 text-pink-500 hover:text-muted-foreground" />
                                  ) : (
                                    <Archive className="size-4.5 text-muted-foreground hover:text-pink-500" />
                                  )}
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                {episode.is_archived ? "Unarchive" : "Archive"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
