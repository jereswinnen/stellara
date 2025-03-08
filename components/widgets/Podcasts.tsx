"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePodcasts, podcastEvents } from "@/hooks/usePodcasts";
import { HeadphonesIcon, PlusIcon } from "lucide-react";
import { useCommandMenu } from "@/components/providers/CommandMenuProvider";
import { formatDistanceToNow } from "date-fns";
import { formatDuration } from "@/lib/utils";
import Link from "next/link";

export function Podcasts() {
  const { user } = useAuth();
  const { recentEpisodes, feeds, loading } = usePodcasts(user);
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

  return (
    <Card className="col-span-full md:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
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
          <div className="flex items-center justify-center h-32">
            <HeadphonesIcon className="mr-2 h-4 w-4 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading podcasts...</p>
          </div>
        ) : recentEpisodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
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
              Add Podcast Feed
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEpisodes.slice(0, 5).map((episode) => {
              const feed = getFeedById(episode.feed_id);
              return (
                <div
                  key={episode.id}
                  className="flex items-start gap-3 pb-3 last:pb-0 border-b last:border-0"
                >
                  {(episode.image_url || feed?.artwork_url) && (
                    <img
                      src={episode.image_url || feed?.artwork_url || ""}
                      alt={episode.title}
                      className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-medium truncate ${
                        episode.is_played ? "text-muted-foreground" : ""
                      }`}
                    >
                      {episode.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {feed?.title} •{" "}
                      {formatDistanceToNow(new Date(episode.published_date), {
                        addSuffix: true,
                      })}
                      {episode.duration > 0 &&
                        ` • ${formatDuration(episode.duration)}`}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <Link href="/podcasts" passHref>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  View all podcasts
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
