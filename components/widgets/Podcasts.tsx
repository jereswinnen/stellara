"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePodcasts, podcastEvents } from "@/hooks/usePodcasts";
import { HeadphonesIcon, PlusIcon, Loader2, Pause, Play } from "lucide-react";
import { useCommandMenu } from "@/components/providers/CommandMenuProvider";
import { useAudioPlayer } from "@/components/providers/AudioPlayerProvider";
import { formatDistanceToNow } from "date-fns";
import { formatDuration } from "@/lib/utils";
import Link from "next/link";

export function Podcasts() {
  const { user } = useAuth();
  const { recentEpisodes, feeds, loading } = usePodcasts(user);
  const { playEpisode, currentEpisode, isLoading } = useAudioPlayer();
  const { openAddPodcastSheet } = useCommandMenu();
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Recent Podcasts</CardTitle>
        <Button size="sm" className="size-8" onClick={openAddPodcastSheet}>
          <PlusIcon className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex gap-2 items-center justify-center">
            <Loader2 className="size-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading podcasts...</p>
          </div>
        ) : recentEpisodes.length === 0 ? (
          <div className="flex flex-col gap-4 items-center justify-center text-center">
            <HeadphonesIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No podcast episodes yet
            </p>
            <Button variant="outline" size="sm" onClick={openAddPodcastSheet}>
              <PlusIcon className="size-3" />
              Add Podcast
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recentEpisodes.slice(0, 5).map((episode) => {
              const feed = getFeedById(episode.feed_id);
              const isPlaying = currentEpisode?.id === episode.id;
              const isCurrentlyLoading = isPlaying && isLoading;

              return (
                <div
                  key={episode.id}
                  className="cursor-pointer flex items-center gap-2 p-3 rounded-md border hover:bg-muted/50 transition-colors"
                  onClick={() => handlePlayEpisode(episode)}
                >
                  <div className="flex-shrink-0">
                    <img
                      src={episode.image_url || feed?.artwork_url || ""}
                      alt={episode.title}
                      className="size-10 object-cover rounded"
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium line-clamp-1">
                      {episode.title}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <p className="line-clamp-1">{feed?.title}</p>
                      <>
                        <span className="text-muted-foreground">&bull;</span>
                        <p>
                          {formatDistanceToNow(
                            new Date(episode.published_date),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handlePlayEpisode(episode)}
                    disabled={isPlaying}
                  >
                    {isCurrentlyLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="size-4 text-primary" />
                    ) : (
                      <Play className="size-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
