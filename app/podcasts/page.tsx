"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { PodcastEpisode, PodcastFeed } from "@/hooks/usePodcasts";
import { formatDuration } from "@/lib/utils";

export default function PodcastsPage() {
  const { user } = useAuth();
  const {
    feeds,
    episodes,
    loading,
    refreshPodcastFeed,
    deletePodcastFeed,
    updateEpisodeStatus,
  } = usePodcasts(user);
  const { playEpisode, currentEpisode, isLoading } = useAudioPlayer();
  const { openAddPodcastFeedSheet } = useCommandMenu();
  const [activeTab, setActiveTab] = useState("all");
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(
    new Set()
  );
  const [refreshingFeed, setRefreshingFeed] = useState<string | null>(null);
  const [playerVisible, setPlayerVisible] = useState(false);

  // Update player visibility when currentEpisode changes
  useEffect(() => {
    setPlayerVisible(!!currentEpisode);
  }, [currentEpisode]);

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
  const handleRefreshFeed = async (feedId: string) => {
    setRefreshingFeed(feedId);
    try {
      await refreshPodcastFeed(feedId);
    } finally {
      setRefreshingFeed(null);
    }
  };

  // Handle deleting a podcast feed
  const handleDeleteFeed = async (feedId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this podcast feed and all its episodes?"
      )
    ) {
      await deletePodcastFeed(feedId);
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

  // Filter episodes based on active tab
  const filteredEpisodes = episodes.filter((episode) => {
    if (activeTab === "all") return true;
    if (activeTab === "unplayed") return !episode.is_played;
    if (activeTab === "favorites") return episode.is_favorite;
    if (activeTab === "archived") return episode.is_archived;
    return true;
  });

  // Group episodes by feed
  const episodesByFeed: Record<string, PodcastEpisode[]> = {};
  filteredEpisodes.forEach((episode) => {
    if (!episodesByFeed[episode.feed_id]) {
      episodesByFeed[episode.feed_id] = [];
    }
    episodesByFeed[episode.feed_id].push(episode);
  });

  // Find feed by ID
  const getFeedById = (feedId: string): PodcastFeed | undefined => {
    return feeds.find((feed) => feed.id === feedId);
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
        <Button onClick={openAddPodcastFeedSheet}>
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
            <Button onClick={openAddPodcastFeedSheet}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Podcast Feed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Podcast Feeds</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feeds.map((feed) => (
                <Card key={feed.id}>
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
                        {episodesByFeed[feed.id]?.length || 0} episodes
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRefreshFeed(feed.id)}
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
                          onClick={() => handleDeleteFeed(feed.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h2 className="text-xl font-semibold mb-4">Episodes</h2>
            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList>
                <TabsTrigger value="all">All Episodes</TabsTrigger>
                <TabsTrigger value="unplayed">Unplayed</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredEpisodes.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No episodes found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEpisodes.map((episode) => {
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
                              {formatDistanceToNow(
                                new Date(episode.published_date),
                                { addSuffix: true }
                              )}
                              {episode.duration > 0 &&
                                ` • ${formatDuration(episode.duration)}`}
                              {episode.play_position > 0 && !isPlaying && (
                                <span className="ml-1 text-primary">
                                  •{" "}
                                  {Math.floor(
                                    (episode.play_position / episode.duration) *
                                      100
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
                            <div className="flex gap-2">
                              <Button
                                variant={
                                  episode.is_favorite ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => handleToggleFavorite(episode)}
                              >
                                {episode.is_favorite ? "Favorited" : "Favorite"}
                              </Button>
                              <Button
                                variant={
                                  episode.is_archived ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => handleToggleArchived(episode)}
                              >
                                {episode.is_archived ? "Archived" : "Archive"}
                              </Button>
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
            )}
          </div>
        </>
      )}

      {/* Add padding at the bottom to account for the audio player */}
      {playerVisible && <div className="h-20" />}
    </div>
  );
}
