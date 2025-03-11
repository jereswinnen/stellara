"use client";

import { useRef, useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NewPodcastFeedData,
  fetchPodcastFeedMetadata,
  searchPodcasts,
} from "@/hooks/usePodcasts";
import { Loader2, Plus, Search } from "lucide-react";

interface AddPodcastFeedSheetProps {
  onAddPodcastFeed: (feedData: NewPodcastFeedData) => Promise<boolean>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPodcastSheet({
  onAddPodcastFeed,
  isOpen,
  onOpenChange,
}: AddPodcastFeedSheetProps) {
  const [activeTab, setActiveTab] = useState("search");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [newFeed, setNewFeed] = useState<NewPodcastFeedData>({
    feed_url: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingPodcastId, setAddingPodcastId] = useState<string | null>(null);

  // Focus on search input when sheet opens
  useEffect(() => {
    const sheetOpen = isOpen !== undefined ? isOpen : isSheetOpen;

    if (sheetOpen) {
      // Use multiple attempts with increasing delays to ensure focus
      const attempts = [100, 200, 300, 500];

      attempts.forEach((delay) => {
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, delay);
      });
    }
  }, [isOpen, isSheetOpen]);

  // Handle sheet open state changes
  const handleOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    onOpenChange(open);

    // Reset form when closing
    if (!open) {
      // Focus the search input when the sheet opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      setNewFeed({ feed_url: "" });
      setSearchTerm("");
      setSearchResults([]);
      setError(null);
      setAddingPodcastId(null);
      setActiveTab("search");
    }
  };

  // Handle search input change
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setError(null);

    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      console.log(`Searching for podcasts: "${term}"`);
      const results = await searchPodcasts(term);
      console.log(`Search returned ${results.length} results:`, results);

      setSearchResults(results);

      if (results.length === 0) {
        console.log("No search results found");
      }
    } catch (error) {
      console.error("Error searching podcasts:", error);
      setError("Failed to search podcasts. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle adding a podcast directly from search results
  const handleAddPodcast = async (podcast: any) => {
    // Make sure we have a feed URL
    if (!podcast.feedUrl) {
      console.error("Selected podcast doesn't have a feed URL:", podcast);
      setError(
        "Selected podcast doesn't have a feed URL. Please try a different podcast."
      );
      return;
    }

    setAddingPodcastId(podcast.collectionId);
    setIsSubmitting(true);

    try {
      const success = await onAddPodcastFeed({ feed_url: podcast.feedUrl });
      if (success) {
        handleOpenChange(false);
      } else {
        setError("Failed to add podcast feed. Please try again.");
      }
    } catch (error) {
      console.error("Error adding podcast feed:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
      setAddingPodcastId(null);
    }
  };

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setNewFeed({ ...newFeed, feed_url: url });
    setError(null);
  };

  // Handle manual URL submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newFeed.feed_url) {
      setError("Please enter a podcast feed URL");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onAddPodcastFeed(newFeed);
      if (success) {
        handleOpenChange(false);
      } else {
        setError("Failed to add podcast feed. Please try again.");
      }
    } catch (error) {
      console.error("Error adding podcast feed:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border">
          <SheetTitle>Add Podcast Feed</SheetTitle>
        </SheetHeader>

        <Tabs
          defaultValue="search"
          value={activeTab}
          onValueChange={setActiveTab}
          className="px-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="url">Add Manually</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="search"
                  ref={searchInputRef}
                  placeholder="Enter a podcast name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  disabled={isSubmitting}
                />
              </div>
              {isSearching && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Searching...
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2">
                {searchResults.map((podcast) => (
                  <div
                    key={podcast.collectionId}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/30 transition-colors"
                  >
                    {podcast.artworkUrl100 && (
                      <img
                        src={podcast.artworkUrl100}
                        alt={podcast.collectionName}
                        className="size-10 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">
                        {podcast.collectionName}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {podcast.artistName}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => handleAddPodcast(podcast)}
                      disabled={
                        isSubmitting || addingPodcastId === podcast.collectionId
                      }
                      className="flex-shrink-0"
                    >
                      {addingPodcastId === podcast.collectionId ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">
                  {error ||
                    "No podcasts found. Try a different search term or enter the RSS URL directly."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("url")}
                >
                  Enter an RSS feed URL manually
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Input
                id="feed_url"
                placeholder="Enter a podcast RSS feed URL..."
                value={newFeed.feed_url}
                onChange={handleUrlChange}
                disabled={isSubmitting}
              />
            </div>

            <SheetFooter className="px-0">
              <Button
                type="button"
                onClick={handleManualSubmit}
                disabled={isSubmitting || !newFeed.feed_url}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Podcast"
                )}
              </Button>
            </SheetFooter>
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-destructive mt-4 px-4">{error}</p>}
      </SheetContent>
    </Sheet>
  );
}
