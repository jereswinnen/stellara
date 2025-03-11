"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import {
  HeadphonesIcon,
  Loader2,
  StarIcon,
  ListIcon,
  ArchiveIcon,
  RefreshCwIcon,
} from "lucide-react";
import { PodcastEpisode, PodcastFeed } from "@/hooks/usePodcasts";
import { formatDuration } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface ViewPodcastSheetProps {
  podcast: PodcastFeed | null;
  episodes: PodcastEpisode[];
  expandedEpisodes: Set<string>;
  currentEpisode: PodcastEpisode | null;
  isLoading: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  toggleEpisodeExpanded: (id: string) => void;
  handleToggleFavorite: (episode: PodcastEpisode) => void;
  handleToggleArchived: (episode: PodcastEpisode) => void;
  handleToggleQueue: (episode: PodcastEpisode) => void;
  handlePlayEpisode: (episode: PodcastEpisode) => void;
  fetchAllEpisodesForFeed?: (feedId: string) => Promise<PodcastEpisode[]>;
  refreshPodcastFeed?: (feedId: string) => Promise<boolean>;
}

export function ViewPodcastSheet({
  podcast,
  episodes: initialEpisodes,
  expandedEpisodes,
  currentEpisode,
  isLoading,
  isOpen,
  onOpenChange,
  toggleEpisodeExpanded,
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
          ...updates,
          is_in_queue: updates.is_in_queue ?? false, // Default to inbox (not queued) unless explicitly set
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
    }
  };

  // Handle toggling queue status with temporary episode support
  const handleToggleQueueWithTemp = async (episode: PodcastEpisode) => {
    const episodeId = episode.id;
    setProcessingEpisodeIds((prev) => new Set(prev).add(episodeId));

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
    }
  };

  // Handle toggling archived status with temporary episode support
  const handleToggleArchivedWithTemp = async (episode: PodcastEpisode) => {
    const episodeId = episode.id;
    setProcessingEpisodeIds((prev) => new Set(prev).add(episodeId));

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
    }
  };

  // Handle playing an episode with temporary episode support
  const handlePlayEpisodeWithTemp = async (episode: PodcastEpisode) => {
    const episodeId = episode.id;
    setProcessingEpisodeIds((prev) => new Set(prev).add(episodeId));

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
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {podcast && (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-4">
                {podcast.artwork_url && (
                  <img
                    src={podcast.artwork_url}
                    alt={podcast.title}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <SheetTitle>{podcast.title}</SheetTitle>
                  <SheetDescription>{podcast.author}</SheetDescription>
                </div>
                {refreshPodcastFeed && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCwIcon
                      className={`h-4 w-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="mt-2 mb-6">
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: podcast.description }}
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Episodes</h3>
                {isLoadingEpisodes && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading episodes...
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

                  return (
                    <Card key={episode.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          {(episode.image_url || podcast.artwork_url) && (
                            <img
                              src={
                                episode.image_url || podcast.artwork_url || ""
                              }
                              alt={episode.title}
                              className="h-16 w-16 rounded-md object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle
                              className={`text-lg ${
                                episode.is_played
                                  ? "text-muted-foreground"
                                  : "font-semibold"
                              }`}
                            >
                              {episode.title}
                            </CardTitle>
                            <CardDescription className="truncate">
                              {formatDistanceToNow(
                                new Date(episode.published_date),
                                { addSuffix: true }
                              )}
                              {episode.duration > 0 &&
                                ` • ${formatDuration(episode.duration)}`}
                              {episode.play_position > 0 && !isLoading && (
                                <span className="ml-1 text-primary">
                                  •{" "}
                                  {Math.floor(
                                    (episode.play_position / episode.duration) *
                                      100
                                  )}
                                  % played
                                </span>
                              )}
                              {isTemp && (
                                <span className="ml-1 text-muted-foreground">
                                  •{" "}
                                  <span className="bg-muted px-1 py-0.5 rounded-sm text-xs">
                                    Not in library
                                  </span>
                                </span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {expandedEpisodes.has(episode.id) && (
                            <div
                              className="text-sm prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: episode.description,
                              }}
                            />
                          )}
                          <div className="flex justify-between items-center">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => toggleEpisodeExpanded(episode.id)}
                              className="px-0"
                            >
                              {expandedEpisodes.has(episode.id)
                                ? "Show less"
                                : "Show more"}
                            </Button>
                            <div className="flex flex-wrap gap-2 justify-end">
                              <Button
                                variant={
                                  episode.is_favorite ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  handleToggleFavoriteWithTemp(episode)
                                }
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <StarIcon className="h-4 w-4 mr-1" />
                                )}
                                {episode.is_favorite ? "Favorited" : "Favorite"}
                              </Button>
                              <Button
                                variant={
                                  episode.is_in_queue ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  handleToggleQueueWithTemp(episode)
                                }
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <ListIcon className="h-4 w-4 mr-1" />
                                )}
                                {episode.is_in_queue
                                  ? "Remove from Queue"
                                  : "Add to Queue"}
                              </Button>
                              <Button
                                variant={
                                  episode.is_archived ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  handleToggleArchivedWithTemp(episode)
                                }
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <ArchiveIcon className="h-4 w-4 mr-1" />
                                )}
                                {episode.is_archived ? "Unarchive" : "Archive"}
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  handlePlayEpisodeWithTemp(episode)
                                }
                                disabled={isEpisodePlaying || isProcessing}
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : isEpisodeLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                  </>
                                ) : isEpisodePlaying ? (
                                  <>
                                    <HeadphonesIcon className="mr-2 h-4 w-4 animate-pulse" />
                                    Playing...
                                  </>
                                ) : (
                                  <>
                                    <HeadphonesIcon className="mr-2 h-4 w-4" />
                                    Play
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
