"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  useUserPreferences,
  useAudioPlayerPreferences,
} from "@/components/providers/UserPreferencesProvider";
import { PLAYBACK_SPEEDS } from "@/components/providers/AudioPlayerProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const {
    preferences,
    updatePreference,
    isLoading: preferencesLoading,
  } = useUserPreferences();
  const { audioPreferences, updateAudioPreference } =
    useAudioPlayerPreferences();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [loading, user, router]);

  if (loading || preferencesLoading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Format playback speed for display
  const formatPlaybackSpeed = (speed: number) => {
    return `${speed.toFixed(2).replace(/\.00$/, "")}×`;
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Customize your experience</p>
      </header>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Reading Preferences</CardTitle>
            <CardDescription>
              Customize how articles appear when you read them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="reader-background">Reader Background Color</Label>
              <RadioGroup
                id="reader-background"
                value={preferences.readerBackgroundColor}
                onValueChange={(value: string) =>
                  updatePreference(
                    "readerBackgroundColor",
                    value as "default" | "green" | "sepia"
                  )
                }
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="default" />
                  <Label htmlFor="default" className="flex items-center">
                    <div className="w-6 h-6 rounded border mr-2 bg-background"></div>
                    Default
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="green" id="green" />
                  <Label htmlFor="green" className="flex items-center">
                    <div className="w-6 h-6 rounded border mr-2 bg-green-50 dark:bg-green-950"></div>
                    Green
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sepia" id="sepia" />
                  <Label htmlFor="sepia" className="flex items-center">
                    <div className="w-6 h-6 rounded border mr-2 bg-amber-50 dark:bg-amber-950"></div>
                    Sepia
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Podcast Player Preferences</CardTitle>
            <CardDescription>
              Customize your podcast listening experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Skip Forward Duration */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="forward-skip">Skip Forward Duration</Label>
                <span className="text-sm font-medium">
                  {audioPreferences.forwardSkipSeconds} seconds
                </span>
              </div>
              <Slider
                id="forward-skip"
                value={[audioPreferences.forwardSkipSeconds]}
                min={5}
                max={60}
                step={5}
                onValueChange={(value: number[]) =>
                  updateAudioPreference("forwardSkipSeconds", value[0])
                }
              />
            </div>

            <Separator />

            {/* Skip Backward Duration */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="backward-skip">Skip Backward Duration</Label>
                <span className="text-sm font-medium">
                  {audioPreferences.backwardSkipSeconds} seconds
                </span>
              </div>
              <Slider
                id="backward-skip"
                value={[audioPreferences.backwardSkipSeconds]}
                min={5}
                max={30}
                step={5}
                onValueChange={(value: number[]) =>
                  updateAudioPreference("backwardSkipSeconds", value[0])
                }
              />
            </div>

            <Separator />

            {/* Default Playback Speed */}
            <div className="space-y-4">
              <Label htmlFor="playback-speed">Default Playback Speed</Label>
              <Select
                value={audioPreferences.playbackSpeed.toString()}
                onValueChange={(value) =>
                  updateAudioPreference("playbackSpeed", parseFloat(value))
                }
              >
                <SelectTrigger id="playback-speed" className="w-full">
                  <SelectValue placeholder="Select playback speed" />
                </SelectTrigger>
                <SelectContent>
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <SelectItem key={speed} value={speed.toString()}>
                      {formatPlaybackSpeed(speed)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
