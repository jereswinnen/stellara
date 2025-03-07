"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUserPreferences } from "@/components/providers/UserPreferencesProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const {
    preferences,
    updatePreference,
    isLoading: preferencesLoading,
  } = useUserPreferences();
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
      </div>
    </div>
  );
}
