"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
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
import { Loader2, Search } from "lucide-react";

// Popular podcasts to show as examples
const POPULAR_PODCASTS = [
  {
    id: "160904630",
    name: "TED Talks Daily",
    feedUrl: "https://feeds.acast.com/public/shows/67587e77c705e441797aff96",
  },
  {
    id: "523121474",
    name: "TED Radio Hour",
    feedUrl: "https://feeds.npr.org/510298/podcast.xml",
  },
  {
    id: "1200361736",
    name: "The Joe Rogan Experience",
    feedUrl: "https://spotifeed.timdorr.com/4rOoJ6Egrf8K2IrywzwOMk",
  },
  {
    id: "1489380590",
    name: "SmartLess",
    feedUrl: "https://rss.art19.com/smartless",
  },
  {
    id: "1465767420",
    name: "Crime Junkie",
    feedUrl: "https://feeds.simplecast.com/qm_9xx0g",
  },
  {
    id: "1028908750",
    name: "TED Talks Daily (older)",
    feedUrl: "https://feeds.feedburner.com/TEDTalks_audio",
  },
  {
    id: "1441457201",
    name: "Stuff You Should Know",
    feedUrl: "https://feeds.megaphone.fm/stuffyoushouldknow",
  },
  {
    id: "1119389968",
    name: "Revisionist History",
    feedUrl: "https://feeds.megaphone.fm/revisionisthistory",
  },
  {
    id: "1322200189",
    name: "Freakonomics Radio",
    feedUrl: "https://feeds.simplecast.com/Y8lFbOT4",
  },
  {
    id: "1096830182",
    name: "Radiolab",
    feedUrl: "https://feeds.simplecast.com/DzcHE0fU",
  },
];

// Curated podcast categories
const PODCAST_CATEGORIES = [
  {
    name: "News & Politics",
    podcasts: [
      {
        id: "121493804",
        name: "NPR News Now",
        feedUrl: "https://feeds.npr.org/500005/podcast.xml",
      },
      {
        id: "1200361736",
        name: "The Daily",
        feedUrl: "https://feeds.simplecast.com/54nAGcIl",
      },
      {
        id: "1334878780",
        name: "Up First",
        feedUrl: "https://feeds.npr.org/510318/podcast.xml",
      },
    ],
  },
  {
    name: "True Crime",
    podcasts: [
      {
        id: "1465767420",
        name: "Crime Junkie",
        feedUrl: "https://feeds.simplecast.com/qm_9xx0g",
      },
      {
        id: "1322200189",
        name: "Serial",
        feedUrl: "https://feeds.simplecast.com/xl36XBC2",
      },
      {
        id: "1096830182",
        name: "My Favorite Murder",
        feedUrl: "https://feeds.simplecast.com/FdR3_M4y",
      },
    ],
  },
  {
    name: "Comedy",
    podcasts: [
      {
        id: "1489380590",
        name: "SmartLess",
        feedUrl: "https://rss.art19.com/smartless",
      },
      {
        id: "1441457201",
        name: "Conan O'Brien Needs A Friend",
        feedUrl: "https://feeds.simplecast.com/dHoohVNH",
      },
      {
        id: "1119389968",
        name: "WTF with Marc Maron",
        feedUrl: "https://feeds.simplecast.com/cYQVc__c",
      },
    ],
  },
];

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
  const [newFeed, setNewFeed] = useState<NewPodcastFeedData>({
    feed_url: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [feedPreview, setFeedPreview] = useState<{
    title?: string;
    author?: string;
    artworkUrl?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPodcast, setSelectedPodcast] = useState<any | null>(null);

  // Handle sheet open state changes
  const handleOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    onOpenChange(open);

    // Reset form when closing
    if (!open) {
      setNewFeed({ feed_url: "" });
      setSearchTerm("");
      setSearchResults([]);
      setFeedPreview(null);
      setError(null);
      setSelectedPodcast(null);
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

  // Handle selecting a podcast from search results
  const handleSelectPodcast = async (podcast: any) => {
    setSelectedPodcast(podcast);

    // Make sure we have a feed URL
    if (!podcast.feedUrl) {
      console.error("Selected podcast doesn't have a feed URL:", podcast);
      setError(
        "Selected podcast doesn't have a feed URL. Please try a different podcast."
      );
      return;
    }

    setNewFeed({ feed_url: podcast.feedUrl });

    // Fetch metadata to verify the feed works
    setIsFetchingMetadata(true);
    try {
      console.log(`Fetching metadata for podcast feed: ${podcast.feedUrl}`);
      const metadata = await fetchPodcastFeedMetadata(podcast.feedUrl);
      if (metadata) {
        setFeedPreview({
          title: metadata.title || podcast.collectionName,
          author: metadata.author || podcast.artistName,
          artworkUrl:
            metadata.artworkUrl ||
            podcast.artworkUrl600 ||
            podcast.artworkUrl100,
        });
      } else {
        // If metadata fetch fails, use the podcast data from search results
        console.log(
          "Metadata fetch failed, using podcast data from search results as fallback"
        );
        setFeedPreview({
          title: podcast.collectionName,
          author: podcast.artistName,
          artworkUrl: podcast.artworkUrl600 || podcast.artworkUrl100,
        });
      }
    } catch (error) {
      console.error("Error fetching podcast metadata:", error);
      // Use the podcast data from search results as fallback
      setFeedPreview({
        title: podcast.collectionName,
        author: podcast.artistName,
        artworkUrl: podcast.artworkUrl600 || podcast.artworkUrl100,
      });
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newFeed.feed_url) {
      setError(
        "Please enter a podcast feed URL or select a podcast from search results"
      );
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

  // Handle URL input change and fetch metadata
  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setNewFeed({ ...newFeed, feed_url: url });
    setFeedPreview(null);
    setError(null);
    setSelectedPodcast(null);

    // Only fetch metadata if URL is valid
    if (
      url &&
      (url.startsWith("http") || url.startsWith("https")) &&
      url.includes(".")
    ) {
      setIsFetchingMetadata(true);
      try {
        const metadata = await fetchPodcastFeedMetadata(url);
        if (metadata) {
          setFeedPreview({
            title: metadata.title,
            author: metadata.author,
            artworkUrl: metadata.artworkUrl,
          });
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        setError("Could not validate podcast feed. Please check the URL.");
      } finally {
        setIsFetchingMetadata(false);
      }
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
            <TabsTrigger value="search">Search Podcasts</TabsTrigger>
            <TabsTrigger value="url">Enter RSS URL</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search for a podcast</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by podcast name or creator"
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  disabled={isSubmitting}
                />
              </div>
              {isSearching && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                <Label>Search Results</Label>
                <div className="space-y-2">
                  {searchResults.map((podcast) => (
                    <div
                      key={podcast.collectionId}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent ${
                        selectedPodcast?.collectionId === podcast.collectionId
                          ? "bg-accent"
                          : ""
                      }`}
                      onClick={() => handleSelectPodcast(podcast)}
                    >
                      {podcast.artworkUrl100 && (
                        <img
                          src={podcast.artworkUrl100}
                          alt={podcast.collectionName}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {podcast.collectionName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {podcast.artistName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  Switch to Manual URL Entry
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="feed_url">Podcast RSS Feed URL</Label>
              <Input
                id="feed_url"
                placeholder="https://example.com/podcast.xml"
                value={newFeed.feed_url}
                onChange={handleUrlChange}
                disabled={isSubmitting}
              />
              {isFetchingMetadata && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating feed...
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {feedPreview && (
          <div className="rounded-md border p-4">
            <h3 className="font-medium">Feed Preview</h3>
            <div className="mt-2 flex items-center gap-4">
              {feedPreview.artworkUrl && (
                <img
                  src={feedPreview.artworkUrl}
                  alt={feedPreview.title || "Podcast artwork"}
                  className="h-16 w-16 rounded-md object-cover"
                />
              )}
              <div>
                <p className="font-medium">{feedPreview.title}</p>
                <p className="text-sm text-muted-foreground">
                  {feedPreview.author}
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  Feed URL: {newFeed.feed_url}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive mt-4">{error}</p>}

        <div className="px-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              isFetchingMetadata ||
              isSearching ||
              !newFeed.feed_url
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Podcast"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
