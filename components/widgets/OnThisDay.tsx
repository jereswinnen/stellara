"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoricalEvent {
  text: string;
  year: string;
  pages: {
    title: string;
    thumbnail?: {
      source: string;
      width: number;
      height: number;
    };
    extract: string;
    content_urls: {
      desktop: {
        page: string;
      };
    };
  }[];
}

interface OnThisDayResponse {
  events: HistoricalEvent[];
  births: HistoricalEvent[];
  deaths: HistoricalEvent[];
  holidays: {
    text: string;
    pages: any[];
  }[];
}

export function OnThisDay() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(
    null
  );

  useEffect(() => {
    const fetchOnThisDayEvents = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        const response = await fetch(
          `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${month}/${day}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const data: OnThisDayResponse = await response.json();

        // Sort events by year (most recent first) and take the top 5
        const sortedEvents = data.events
          .sort((a, b) => parseInt(b.year) - parseInt(a.year))
          .slice(0, 5);

        setEvents(sortedEvents);

        // Set the first event as selected by default
        if (sortedEvents.length > 0) {
          setSelectedEvent(sortedEvents[0]);
        }
      } catch (err) {
        console.error("Error fetching on this day events:", err);
        setError("Failed to load historical events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOnThisDayEvents();
  }, []);

  const handleEventClick = (event: HistoricalEvent) => {
    setSelectedEvent(event);
  };

  if (error) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            On This Day in History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p className="text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          On This Day in History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="flex space-x-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-16" />
              ))}
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {events.map((event, index) => (
                <button
                  key={index}
                  onClick={() => handleEventClick(event)}
                  className={`cursor-pointer px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedEvent === event
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {event.year}
                </button>
              ))}
            </div>

            {selectedEvent && (
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      <span className="font-bold">{selectedEvent.year}:</span>{" "}
                      {selectedEvent.text}
                    </p>

                    {selectedEvent.pages[0]?.extract && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedEvent.pages[0].extract}
                      </p>
                    )}

                    {selectedEvent.pages[0]?.content_urls?.desktop?.page && (
                      <a
                        href={selectedEvent.pages[0].content_urls.desktop.page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-2 inline-block"
                      >
                        Read more on Wikipedia
                      </a>
                    )}
                  </div>

                  {selectedEvent.pages[0]?.thumbnail && (
                    <div className="flex-shrink-0">
                      <Image
                        src={selectedEvent.pages[0].thumbnail.source}
                        alt={selectedEvent.pages[0].title}
                        width={100}
                        height={100}
                        className="rounded-md object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
