"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DateTime() {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Only render the dynamic content after mounting on the client
  if (!mounted) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Date & Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-3xl font-bold opacity-0">00:00:00</p>
            <p className="text-sm text-muted-foreground opacity-0">
              Loading...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Date & Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-3xl font-bold">
            {date.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
              hour12: undefined, // This will use the locale's preference
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {date.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
