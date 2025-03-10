"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePodcasts } from "@/hooks/usePodcasts";
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
import { Separator } from "@/components/ui/separator";
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
  } = usePodcasts(user);
  const { playEpisode, currentEpisode, isLoading } = useAudioPlayer();
  const { openAddPodcastSheet } = useCommandMenu();
  const [activeTab, setActiveTab] = useState("inbox");
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(
    new Set()
  );
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

  // Toggle episode expanded state
  const toggleEpisodeExpanded = (episodeId: string) => {
    const newExpanded = new Set(expandedEpisodes);
    if (newExpanded.has(episodeId)) {
      newExpanded.delete(episodeId);
    } else {
      newExpanded.add(episodeId);
    }
    setExpandedEpisodes(newExpanded);
  };

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

  // Get episodes for the selected podcast (from database only)
  const getPodcastEpisodes = (feedId: string): PodcastEpisode[] => {
    return episodes
      .filter((episode) => episode.feed_id === feedId)
      .sort(
        (a, b) =>
          new Date(b.published_date).getTime() -
          new Date(a.published_date).getTime()
      );
  };

  // Get episodes based on active tab
  const getTabEpisodes = (): PodcastEpisode[] => {
    switch (activeTab) {
      case "inbox":
        return inboxEpisodes;
      case "queue":
        return queueEpisodes;
      case "favorites":
        return favoriteEpisodes;
      default:
        return episodes.filter((episode) => !episode.is_archived);
    }
  };

  // Find feed by ID
  const getFeedById = (feedId: string): PodcastFeed | undefined => {
    return feeds.find((feed) => feed.id === feedId);
  };

  // Get episode count for a feed
  const getEpisodeCount = (feedId: string): number | null => {
    if (loadingCounts.has(feedId)) {
      return null; // Still loading
    }
    return episodeCounts[feedId] || 0;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Podcasts</h1>
          <p className="text-muted-foreground">
            Listen to your favorite podcasts
          </p>
        </div>
        <Button onClick={openAddPodcastSheet}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Podcast Feed
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <HeadphonesIcon className="mr-2 h-6 w-6 animate-pulse" />
          <p>Loading podcasts...</p>
        </div>
      ) : feeds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <HeadphonesIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No podcasts yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first podcast feed to get started
            </p>
            <Button onClick={openAddPodcastSheet}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Podcast Feed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs
            defaultValue="inbox"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList>
              <TabsTrigger value="inbox" className="flex items-center gap-2">
                <InboxIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Inbox</span>
              </TabsTrigger>
              <TabsTrigger value="queue" className="flex items-center gap-2">
                <ListIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Queue</span>
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="flex items-center gap-2"
              >
                <StarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Favorites</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <ListIcon className="h-4 w-4" />
                <span className="hidden sm:inline">All</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inbox">
              <EpisodesList
                episodes={inboxEpisodes}
                feeds={feeds}
                expandedEpisodes={expandedEpisodes}
                currentEpisode={currentEpisode}
                isLoading={isLoading}
                toggleEpisodeExpanded={toggleEpisodeExpanded}
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
                expandedEpisodes={expandedEpisodes}
                currentEpisode={currentEpisode}
                isLoading={isLoading}
                toggleEpisodeExpanded={toggleEpisodeExpanded}
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
                expandedEpisodes={expandedEpisodes}
                currentEpisode={currentEpisode}
                isLoading={isLoading}
                toggleEpisodeExpanded={toggleEpisodeExpanded}
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

      {/* Podcast Details Sheet */}
      <ViewPodcastSheet
        podcast={selectedPodcast}
        episodes={[]} // Start with empty array, let the sheet fetch all episodes
        expandedEpisodes={expandedEpisodes}
        currentEpisode={currentEpisode}
        isLoading={isLoading}
        isOpen={isPodcastSheetOpen}
        onOpenChange={setIsPodcastSheetOpen}
        toggleEpisodeExpanded={toggleEpisodeExpanded}
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
  feeds,
  expandedEpisodes,
  currentEpisode,
  isLoading,
  toggleEpisodeExpanded,
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
  expandedEpisodes: Set<string>;
  currentEpisode: PodcastEpisode | null;
  isLoading: boolean;
  toggleEpisodeExpanded: (id: string) => void;
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
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No episodes found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {episodes.map((episode) => {
        const feed = getFeedById(episode.feed_id);
        const isExpanded = expandedEpisodes.has(episode.id);
        const isPlaying = currentEpisode?.id === episode.id;
        const isCurrentlyLoading = isPlaying && isLoading;

        return (
          <Card key={episode.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-4">
                {(episode.image_url || feed?.artwork_url) && (
                  <img
                    src={episode.image_url || feed?.artwork_url || ""}
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
                    {feed?.title} •{" "}
                    {formatDistanceToNow(new Date(episode.published_date), {
                      addSuffix: true,
                    })}
                    {episode.duration > 0 &&
                      ` • ${formatDuration(episode.duration)}`}
                    {episode.play_position > 0 && !isPlaying && (
                      <span className="ml-1 text-primary">
                        •{" "}
                        {Math.floor(
                          (episode.play_position / episode.duration) * 100
                        )}
                        % played
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isExpanded && (
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
                    {isExpanded ? "Show less" : "Show more"}
                  </Button>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      variant={episode.is_favorite ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleFavorite(episode)}
                    >
                      <StarIcon className="h-4 w-4 mr-1" />
                      {episode.is_favorite ? "Favorited" : "Favorite"}
                    </Button>

                    {showQueueButton && (
                      <Button
                        variant={episode.is_in_queue ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleQueue(episode)}
                      >
                        <ListIcon className="h-4 w-4 mr-1" />
                        {episode.is_in_queue
                          ? "Remove from Queue"
                          : "Add to Queue"}
                      </Button>
                    )}

                    {showArchiveButton && (
                      <Button
                        variant={episode.is_archived ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleArchived(episode)}
                      >
                        <ArchiveIcon className="h-4 w-4 mr-1" />
                        {episode.is_archived ? "Unarchive" : "Archive"}
                      </Button>
                    )}

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePlayEpisode(episode)}
                      disabled={isPlaying}
                    >
                      {isCurrentlyLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : isPlaying ? (
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
      })}
    </div>
  );
}
