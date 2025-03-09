"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { PodcastEpisode, usePodcasts } from "@/hooks/usePodcasts";
import { useAuth } from "./AuthProvider";

interface AudioPlayerContextType {
  currentEpisode: PodcastEpisode | null;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  forwardSkipSeconds: number;
  backwardSkipSeconds: number;
  playEpisode: (episode: PodcastEpisode) => void;
  pauseEpisode: () => void;
  resumeEpisode: () => void;
  seekTo: (time: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  togglePlayPause: () => void;
  stopEpisode: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined
);

export function AudioPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { updateEpisodeStatus } = usePodcasts(user);
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const savePositionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Default skip durations
  const forwardSkipSeconds = 30;
  const backwardSkipSeconds = 15;

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Set up event listeners
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      // Clean up event listeners
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);

      // Save position one last time when unmounting
      if (currentEpisode) {
        savePlayPosition();
      }

      // Clear any pending timers
      if (savePositionTimerRef.current) {
        clearInterval(savePositionTimerRef.current);
      }
    };
  }, []);

  // Save play position periodically (every 10 seconds)
  useEffect(() => {
    if (currentEpisode && isPlaying) {
      // Clear any existing timer
      if (savePositionTimerRef.current) {
        clearInterval(savePositionTimerRef.current);
      }

      // Set up a new timer
      savePositionTimerRef.current = setInterval(() => {
        savePlayPosition();
      }, 10000); // Save every 10 seconds
    } else if (savePositionTimerRef.current) {
      // Clear timer if not playing
      clearInterval(savePositionTimerRef.current);
      savePositionTimerRef.current = null;
    }

    return () => {
      if (savePositionTimerRef.current) {
        clearInterval(savePositionTimerRef.current);
      }
    };
  }, [currentEpisode, isPlaying]);

  // Save play position to database
  const savePlayPosition = useCallback(() => {
    if (currentEpisode && audioRef.current) {
      const currentPosition = Math.floor(audioRef.current.currentTime);
      updateEpisodeStatus(currentEpisode.id, {
        play_position: currentPosition,
        is_played: true,
      });
    }
  }, [currentEpisode, updateEpisodeStatus]);

  // Event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsLoading(false);
    savePlayPosition();
  };

  const handlePause = () => {
    setIsPlaying(false);
    setIsLoading(false);
    savePlayPosition();
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  // Player controls
  const playEpisode = useCallback(
    (episode: PodcastEpisode) => {
      if (audioRef.current) {
        // If we're already playing this episode, just resume
        if (currentEpisode?.id === episode.id) {
          audioRef.current.play();
          setIsPlaying(true);
          return;
        }

        // Save position of current episode before switching
        if (currentEpisode) {
          savePlayPosition();
        }

        // Set up new episode
        setCurrentEpisode(episode);
        setIsLoading(true);
        audioRef.current.src = episode.audio_url;

        // Restore previous play position if available
        if (episode.play_position > 0) {
          audioRef.current.currentTime = episode.play_position;
        }

        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
            setIsLoading(false);
          });
      }
    },
    [currentEpisode, savePlayPosition]
  );

  const pauseEpisode = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
      savePlayPosition();
    }
  }, [isPlaying, savePlayPosition]);

  const resumeEpisode = useCallback(() => {
    if (audioRef.current && currentEpisode && !isPlaying) {
      setIsLoading(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Error resuming audio:", error);
          setIsLoading(false);
        });
    }
  }, [currentEpisode, isPlaying]);

  const seekTo = useCallback(
    (time: number) => {
      if (audioRef.current && currentEpisode) {
        setIsLoading(true);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    [currentEpisode]
  );

  const skipForward = useCallback(
    (seconds = forwardSkipSeconds) => {
      if (audioRef.current && currentEpisode) {
        setIsLoading(true);
        const newTime = Math.min(
          audioRef.current.currentTime + seconds,
          duration
        );
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [currentEpisode, duration, forwardSkipSeconds]
  );

  const skipBackward = useCallback(
    (seconds = backwardSkipSeconds) => {
      if (audioRef.current && currentEpisode) {
        setIsLoading(true);
        const newTime = Math.max(audioRef.current.currentTime - seconds, 0);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [currentEpisode, backwardSkipSeconds]
  );

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseEpisode();
    } else {
      resumeEpisode();
    }
  }, [isPlaying, pauseEpisode, resumeEpisode]);

  // Stop episode and clear current episode
  const stopEpisode = useCallback(() => {
    if (audioRef.current && currentEpisode) {
      // Save current position
      savePlayPosition();

      // Stop playback
      audioRef.current.pause();
      audioRef.current.src = "";

      // Reset state
      setIsPlaying(false);
      setIsLoading(false);
      setCurrentTime(0);
      setDuration(0);
      setCurrentEpisode(null);
    }
  }, [currentEpisode, savePlayPosition]);

  const value = {
    currentEpisode,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    forwardSkipSeconds,
    backwardSkipSeconds,
    playEpisode,
    pauseEpisode,
    resumeEpisode,
    seekTo,
    skipForward,
    skipBackward,
    togglePlayPause,
    stopEpisode,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error(
      "useAudioPlayer must be used within an AudioPlayerProvider"
    );
  }
  return context;
}
