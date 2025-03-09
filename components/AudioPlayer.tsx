"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAudioPlayer } from "@/components/providers/AudioPlayerProvider";
import { usePodcasts } from "@/hooks/usePodcasts";
import { formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  PauseIcon,
  PlayIcon,
  ChevronDown,
  Loader2,
  Redo,
  Undo,
} from "lucide-react";

export function AudioPlayer() {
  const {
    currentEpisode,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    forwardSkipSeconds,
    backwardSkipSeconds,
    togglePlayPause,
    skipForward,
    skipBackward,
    seekTo,
    stopEpisode,
  } = useAudioPlayer();
  const { user } = useAuth();
  const { feeds } = usePodcasts(user);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  // Handle showing the player when an episode is loaded
  useEffect(() => {
    if (currentEpisode) {
      setIsClosing(false);
      // Small delay to trigger the animation
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
    }
  }, [currentEpisode]);

  // Handle closing the player
  const handleClose = () => {
    // Start closing animation
    setIsClosing(true);

    // Wait for animation to complete before stopping the episode
    setTimeout(() => {
      stopEpisode();
      setIsVisible(false);
    }, 300); // Match this with the CSS transition duration
  };

  if (!currentEpisode) {
    return null;
  }

  // Find the feed for the current episode
  const feed = feeds.find((feed) => feed.id === currentEpisode.feed_id);

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Format times
  const currentTimeFormatted = formatDuration(Math.floor(currentTime));
  const durationFormatted = formatDuration(Math.floor(duration));

  // Determine player classes based on state
  const playerClasses = `fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border z-50 p-3 shadow-lg transition-transform duration-300 ease-in-out ${
    isVisible ? "translate-y-0" : "translate-y-full"
  } ${isClosing ? "translate-y-full" : ""}`;

  return (
    <div className={playerClasses} ref={playerRef}>
      <div className="container mx-auto grid grid-cols-2 md:grid-cols-3 gap-x-4">
        {/* Episode info */}
        <div className="flex items-center gap-3">
          <img
            src={currentEpisode.image_url || feed?.artwork_url || ""}
            alt={currentEpisode.title}
            className="flex-shrink-0 size-10 object-cover rounded-md"
          />
          <div className="flex flex-col">
            <h4 className="font-medium text-sm line-clamp-1">
              {currentEpisode.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {feed?.title || "Unknown Podcast"}
            </p>
          </div>
        </div>

        {/* Player controls */}
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipBackward()}
            className="flex flex-col gap-1 items-center size-8"
            disabled={isLoading}
          >
            <Undo className="size-5" />
            <span className="font-medium text-xs leading-0">
              {backwardSkipSeconds}
            </span>
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            className="size-10 rounded-full"
            disabled={isLoading && !isPlaying}
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : isPlaying ? (
              <PauseIcon className="size-5" />
            ) : (
              <PlayIcon className="size-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipForward()}
            className="flex flex-col gap-1 items-center size-8"
            disabled={isLoading}
          >
            <Redo className="size-5" />
            <span className="font-medium text-xs leading-0">
              {forwardSkipSeconds}
            </span>
          </Button>
        </div>

        {/* Time and progress */}
        <div className="hidden md:flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground w-10">
            {currentTimeFormatted}
          </span>

          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            className="flex-1"
            disabled={isLoading}
            onValueChange={(value: number[]) => {
              const newTime = (value[0] / 100) * duration;
              seekTo(newTime);
            }}
          />

          <span className="text-xs text-muted-foreground w-10">
            {durationFormatted}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="size-8"
          >
            <ChevronDown className="size-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
