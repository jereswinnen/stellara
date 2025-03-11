"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePodcasts, podcastEvents } from "@/hooks/usePodcasts";
import { useCommandMenu } from "@/components/providers/CommandMenuProvider";
import { useAudioPlayer } from "@/components/providers/AudioPlayerProvider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import {
  HeadphonesIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  Loader2,
  ArchiveIcon,
  StarIcon,
  ListIcon,
  InboxIcon,
  ListMusic,
  AlignJustify,
  Play,
  Pause,
  StarOff,
  Star,
  ListPlus,
  Archive,
} from "lucide-react";
import { PodcastEpisode, PodcastFeed } from "@/hooks/usePodcasts";
import { formatDuration } from "@/lib/utils";
import { ViewPodcastSheet } from "@/components/global/sheets/ViewPodcastSheet";

export default function PodcastsPage() {
  const { user } = useAuth();
  const {
    feeds,
    episodes,
    inboxEpisodes,
    queueEpisodes,
    favoriteEpisodes,
    loading,
    refreshPodcastFeed,
    deletePodcastFeed,
    updateEpisodeStatus,
    fetchAllEpisodesForFeed,
    getEpisodeCountForFeed,
    clearEpisodeCountCache,
    fetchFeeds,
    fetchEpisodes,
  } = usePodcasts(user);
  const { playEpisode, currentEpisode, isLoading } = useAudioPlayer();
  const { openAddPodcastSheet } = useCommandMenu();
  const [activeTab, setActiveTab] = useState("inbox");
  const [refreshingFeed, setRefreshingFeed] = useState<string | null>(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastFeed | null>(
    null
  );
  const [isPodcastSheetOpen, setIsPodcastSheetOpen] = useState(false);
  const [episodeCounts, setEpisodeCounts] = useState<Record<string, number>>(
    {}
  );
  const [loadingCounts, setLoadingCounts] = useState<Set<string>>(new Set());

  // Use a ref to track which feeds we've already processed
  const processedFeedsRef = useRef<Set<string>>(new Set());

  // Subscribe to podcast events to refresh data when changes occur
  useEffect(() => {
    const unsubscribe = podcastEvents.subscribe(() => {
      console.log("PodcastsPage: Received podcast event, refreshing data");
      fetchFeeds();
      fetchEpisodes();
      // Clear all episode counts to force a refresh
      processedFeedsRef.current.clear();
      setEpisodeCounts({});
    });

    return () => {
      unsubscribe();
    };
  }, [fetchFeeds, fetchEpisodes]);

  // Update player visibility when currentEpisode changes
  useEffect(() => {
    setPlayerVisible(!!currentEpisode);
  }, [currentEpisode]);

  // Fetch episode count for a single feed
  const fetchEpisodeCount = useCallback(
    async (feedId: string) => {
      if (loadingCounts.has(feedId) || processedFeedsRef.current.has(feedId)) {
        return;
      }

      setLoadingCounts((prev) => new Set([...prev, feedId]));

      try {
        const count = await getEpisodeCountForFeed(feedId);
        setEpisodeCounts((prev) => ({
          ...prev,
          [feedId]: count,
        }));
        processedFeedsRef.current.add(feedId);
      } catch (error) {
        console.error(`Error fetching count for feed ${feedId}:`, error);
        setEpisodeCounts((prev) => ({
          ...prev,
          [feedId]: 0,
        }));
      } finally {
        setLoadingCounts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(feedId);
          return newSet;
        });
      }
    },
    [getEpisodeCountForFeed]
  );

  // Fetch episode counts for all feeds
  useEffect(() => {
    if (loading || feeds.length === 0) return;

    // Process feeds that don't have counts yet
    feeds.forEach((feed) => {
      if (episodeCounts[feed.id] === undefined && !loadingCounts.has(feed.id)) {
        fetchEpisodeCount(feed.id);
      }
    });
  }, [feeds, loading, fetchEpisodeCount, episodeCounts, loadingCounts]);

  // Handle refreshing a podcast feed
  const handleRefreshFeed = useCallback(
    async (feedId: string) => {
      setRefreshingFeed(feedId);
      try {
        const success = await refreshPodcastFeed(feedId);

        if (success) {
          // Mark this feed as needing a refresh of its episode count
          processedFeedsRef.current.delete(feedId);
          // Clear the cache for this feed
          clearEpisodeCountCache(feedId);
          // Fetch the updated count
          fetchEpisodeCount(feedId);
        }
      } finally {
        setRefreshingFeed(null);
      }
    },
    [refreshPodcastFeed, fetchEpisodeCount, clearEpisodeCountCache]
  );

  // Handle deleting a podcast feed
  const handleDeleteFeed = async (feedId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this podcast feed and all its episodes?"
      )
    ) {
      await deletePodcastFeed(feedId);
      // Clear the cache for this feed
      clearEpisodeCountCache(feedId);
      // Remove from processed feeds
      processedFeedsRef.current.delete(feedId);
      // Remove from episode counts
      setEpisodeCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[feedId];
        return newCounts;
      });
    }
  };

  // Handle playing an episode
  const handlePlayEpisode = async (episode: PodcastEpisode) => {
    // Mark as played if not already
    if (!episode.is_played) {
      await updateEpisodeStatus(episode.id, { is_played: true });
    }

    // Play the episode using the audio player
    playEpisode(episode);
  };

  // Handle toggling favorite status
  const handleToggleFavorite = async (episode: PodcastEpisode) => {
    await updateEpisodeStatus(episode.id, {
      is_favorite: !episode.is_favorite,
    });
  };

  // Handle toggling archived status
  const handleToggleArchived = async (episode: PodcastEpisode) => {
    await updateEpisodeStatus(episode.id, {
      is_archived: !episode.is_archived,
    });
  };

  // Handle toggling queue status
  const handleToggleQueue = async (episode: PodcastEpisode) => {
    await updateEpisodeStatus(episode.id, {
      is_in_queue: !episode.is_in_queue,
    });
  };

  // Handle opening podcast details sheet
  const handleOpenPodcastSheet = (feed: PodcastFeed) => {
    setSelectedPodcast(feed);
    setIsPodcastSheetOpen(true);
  };

  // Find feed by ID
  const getFeedById = (feedId: string): PodcastFeed | undefined => {
    return feeds.find((feed) => feed.id === feedId);
  };

  return (
    <div className="py-6 container mx-auto flex flex-col gap-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Podcasts</h1>
          <p className="text-muted-foreground">
            Listen to your favorite podcasts
          </p>
        </div>
        <Button onClick={openAddPodcastSheet}>
          <PlusIcon className="size-4" />
          Add Podcast Feed
        </Button>
      </header>

      {loading ? (
        <div className="flex gap-2 items-center justify-center">
          <Loader2 className="size-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading podcasts...</p>
        </div>
      ) : feeds.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 border border-border rounded-lg p-6">
          <div className="p-2.5 size-12 rounded-lg border border-border">
            <HeadphonesIcon className="size-full" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h3 className="text-xl font-semibold">No podcasts yet</h3>
            <p className="text-muted-foreground">
              Add your first podcast feed to get started
            </p>
          </div>
          <Button onClick={openAddPodcastSheet}>
            <PlusIcon className="size-4" />
            Add Podcast Feed
          </Button>
        </div>
      ) : (
        <>
          <Tabs
            defaultValue="inbox"
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col gap-4"
          >
            <TabsList>
              <TabsTrigger value="inbox">
                <InboxIcon className="size-4" />
                <span className="hidden sm:inline">Inbox</span>
              </TabsTrigger>
              <TabsTrigger value="queue">
                <ListMusic className="size-4" />
                <span className="hidden sm:inline">Queue</span>
              </TabsTrigger>
              <TabsTrigger value="favorites">
                <StarIcon className="size-4" />
                <span className="hidden sm:inline">Favorites</span>
              </TabsTrigger>
              <TabsTrigger value="all">
                <AlignJustify className="size-4" />
                <span className="hidden sm:inline">All</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inbox">
              <EpisodesList
                episodes={inboxEpisodes}
                feeds={feeds}
                currentEpisode={currentEpisode}
                isLoading={isLoading}
                handleToggleFavorite={handleToggleFavorite}
                handleToggleArchived={handleToggleArchived}
                handleToggleQueue={handleToggleQueue}
                handlePlayEpisode={handlePlayEpisode}
                showQueueButton={true}
                showArchiveButton={true}
                getFeedById={getFeedById}
              />
            </TabsContent>

            <TabsContent value="queue">
              <EpisodesList
                episodes={queueEpisodes}
                feeds={feeds}
                currentEpisode={currentEpisode}
                isLoading={isLoading}
                handleToggleFavorite={handleToggleFavorite}
                handleToggleArchived={handleToggleArchived}
                handleToggleQueue={handleToggleQueue}
                handlePlayEpisode={handlePlayEpisode}
                showQueueButton={true}
                showArchiveButton={true}
                getFeedById={getFeedById}
              />
            </TabsContent>

            <TabsContent value="favorites">
              <EpisodesList
                episodes={favoriteEpisodes}
                feeds={feeds}
                currentEpisode={currentEpisode}
                isLoading={isLoading}
                handleToggleFavorite={handleToggleFavorite}
                handleToggleArchived={handleToggleArchived}
                handleToggleQueue={handleToggleQueue}
                handlePlayEpisode={handlePlayEpisode}
                showQueueButton={true}
                showArchiveButton={true}
                getFeedById={getFeedById}
              />
            </TabsContent>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {feeds.map((feed) => (
                  <Card
                    key={feed.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleOpenPodcastSheet(feed)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-4">
                        {feed.artwork_url && (
                          <img
                            src={feed.artwork_url}
                            alt={feed.title}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {feed.title}
                          </CardTitle>
                          <CardDescription className="truncate">
                            {feed.author}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          {loadingCounts.has(feed.id) ? (
                            <span className="flex items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Loading...
                            </span>
                          ) : (
                            `${episodeCounts[feed.id] || 0} episodes`
                          )}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefreshFeed(feed.id);
                            }}
                            disabled={refreshingFeed === feed.id}
                          >
                            <RefreshCwIcon
                              className={`h-4 w-4 ${
                                refreshingFeed === feed.id ? "animate-spin" : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFeed(feed.id);
                            }}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      <ViewPodcastSheet
        podcast={selectedPodcast}
        episodes={[]} // Start with empty array, let the sheet fetch all episodes
        currentEpisode={currentEpisode}
        isLoading={isLoading}
        isOpen={isPodcastSheetOpen}
        onOpenChange={setIsPodcastSheetOpen}
        handleToggleFavorite={handleToggleFavorite}
        handleToggleArchived={handleToggleArchived}
        handleToggleQueue={handleToggleQueue}
        handlePlayEpisode={handlePlayEpisode}
        fetchAllEpisodesForFeed={fetchAllEpisodesForFeed}
        refreshPodcastFeed={refreshPodcastFeed}
      />

      {/* Add padding at the bottom to account for the audio player */}
      {playerVisible && <div className="h-20" />}
    </div>
  );
}

// Episodes List Component
function EpisodesList({
  episodes,
  currentEpisode,
  isLoading,
  handleToggleFavorite,
  handleToggleArchived,
  handleToggleQueue,
  handlePlayEpisode,
  showQueueButton = true,
  showArchiveButton = true,
  getFeedById,
}: {
  episodes: PodcastEpisode[];
  feeds: PodcastFeed[];
  currentEpisode: PodcastEpisode | null;
  isLoading: boolean;
  handleToggleFavorite: (episode: PodcastEpisode) => void;
  handleToggleArchived: (episode: PodcastEpisode) => void;
  handleToggleQueue: (episode: PodcastEpisode) => void;
  handlePlayEpisode: (episode: PodcastEpisode) => void;
  showQueueButton?: boolean;
  showArchiveButton?: boolean;
  getFeedById: (feedId: string) => PodcastFeed | undefined;
}) {
  if (episodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 border border-border rounded-lg p-6">
        <p className="text-muted-foreground">No episodes found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {episodes.map((episode) => {
        const feed = getFeedById(episode.feed_id);
        const isPlaying = currentEpisode?.id === episode.id;
        const isCurrentlyLoading = isPlaying && isLoading;

        return (
          <div
            key={episode.id}
            className="flex items-center gap-3 border rounded-md p-3 hover:bg-accent/50 transition-colors"
          >
            {(episode.image_url || feed?.artwork_url) && (
              <img
                src={episode.image_url || feed?.artwork_url || ""}
                alt={episode.title}
                className="flex-shrink-0 size-10 object-cover rounded"
              />
            )}
            <div className="flex flex-1 flex-col">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium line-clamp-1">{episode.title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground line-clamp-1">
                  <p>{feed?.title}</p>
                  <span className="text-muted-foreground">&bull;</span>
                  <p>
                    {formatDistanceToNow(new Date(episode.published_date), {
                      addSuffix: true,
                    })}
                  </p>

                  {episode.duration > 0 && (
                    <>
                      <span className="text-muted-foreground">&bull;</span>
                      <p>{formatDuration(episode.duration)}</p>
                    </>
                  )}

                  {episode.play_position > 0 && !isPlaying && (
                    <>
                      <span className="text-muted-foreground">&bull;</span>
                      <p>
                        {Math.floor(
                          (episode.play_position / episode.duration) * 100
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
                      onClick={() => handlePlayEpisode(episode)}
                    >
                      {isCurrentlyLoading ? (
                        <Loader2 className="size-4.5 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="size-4.5" />
                      ) : (
                        <Play className="size-4.5" />
                      )}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isPlaying ? <p>Pause Episode</p> : <p>Play Episode</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <a
                      className="flex-shrink-0 cursor-pointer"
                      tabIndex={-1}
                      onClick={() => handleToggleFavorite(episode)}
                    >
                      {episode.is_favorite ? (
                        <StarOff className="size-4.5 text-muted-foreground" />
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

              {showQueueButton && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <a
                        className="flex-shrink-0 cursor-pointer"
                        tabIndex={-1}
                        onClick={() => handleToggleQueue(episode)}
                      >
                        <ListPlus className="size-4.5 text-muted-foreground" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add to Queue</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {showArchiveButton && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <a
                        className="flex-shrink-0 cursor-pointer"
                        tabIndex={-1}
                        onClick={() => handleToggleArchived(episode)}
                      >
                        <Archive className="size-4.5 text-muted-foreground" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add to Archive</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
