"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePodcasts, podcastEvents } from "@/hooks/usePodcasts";
import { HeadphonesIcon, PlusIcon, Loader2 } from "lucide-react";
import { useCommandMenu } from "@/components/providers/CommandMenuProvider";
import { useAudioPlayer } from "@/components/providers/AudioPlayerProvider";
import { formatDistanceToNow } from "date-fns";
import { formatDuration } from "@/lib/utils";
import Link from "next/link";

export function Podcasts() {
  const { user } = useAuth();
  const { recentEpisodes, feeds, loading } = usePodcasts(user);
  const { playEpisode, currentEpisode, isLoading } = useAudioPlayer();
  const { openAddPodcastFeedSheet } = useCommandMenu();
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to podcast events to refresh the widget when podcasts change
  useEffect(() => {
    const unsubscribe = podcastEvents.subscribe(() => {
      setRefreshKey((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Find feed by ID
  const getFeedById = (feedId: string) => {
    return feeds.find((feed) => feed.id === feedId);
  };

  // Handle playing an episode
  const handlePlayEpisode = (episode: any) => {
    playEpisode(episode);
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">Recent Podcasts</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={openAddPodcastFeedSheet}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[140px]">
            <HeadphonesIcon className="mr-2 h-4 w-4 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading podcasts...</p>
          </div>
        ) : recentEpisodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[140px] text-center">
            <HeadphonesIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              No podcast episodes yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={openAddPodcastFeedSheet}
            >
              <PlusIcon className="mr-2 h-3 w-3" />
              Add Podcast
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEpisodes.slice(0, 5).map((episode) => {
              const feed = getFeedById(episode.feed_id);
              const isPlaying = currentEpisode?.id === episode.id;
              const isCurrentlyLoading = isPlaying && isLoading;

              return (
                <div
                  key={episode.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 flex-shrink-0">
                    <img
                      src={episode.image_url || feed?.artwork_url || ""}
                      alt={episode.title}
                      className="h-full w-full object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">
                      {episode.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {feed?.title} •{" "}
                      {formatDistanceToNow(new Date(episode.published_date), {
                        addSuffix: true,
                      })}
                      {episode.play_position > 0 && !isPlaying && (
                        <span className="ml-1 text-primary">
                          •{" "}
                          {Math.floor(
                            (episode.play_position / episode.duration) * 100
                          )}
                          % played
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePlayEpisode(episode)}
                    disabled={isPlaying}
                  >
                    {isCurrentlyLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isPlaying ? (
                      <HeadphonesIcon className="h-4 w-4 text-primary animate-pulse" />
                    ) : (
                      <HeadphonesIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}
            <div className="pt-2">
              <Link
                href="/podcasts"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                View all podcasts →
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
