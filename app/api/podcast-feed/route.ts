import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

export interface PodcastFeedMetadata {
  title: string;
  author: string;
  description: string;
  artworkUrl: string;
  websiteUrl: string;
  episodes: {
    guid: string;
    title: string;
    description: string;
    audioUrl: string;
    publishedDate: string;
    duration: number;
    imageUrl?: string;
  }[];
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  console.log(`Fetching podcast feed: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch podcast feed: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: `Failed to fetch podcast feed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const xml = await response.text();
    console.log(
      `Received podcast feed XML (first 200 chars): ${xml.substring(0, 200)}...`
    );

    // Parse the XML
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });

      const result = parser.parse(xml);
      const channel = result.rss?.channel;

      if (!channel) {
        console.error("Invalid podcast feed format - no channel found");
        return NextResponse.json(
          { error: "Invalid podcast feed format" },
          { status: 400 }
        );
      }

      // Extract podcast metadata
      const metadata: PodcastFeedMetadata = {
        title: channel.title || "Unknown Podcast",
        author: channel["itunes:author"] || channel.author || "Unknown Author",
        description: channel.description || channel["itunes:summary"] || "",
        artworkUrl:
          channel["itunes:image"]?.["@_href"] || channel.image?.url || "",
        websiteUrl: channel.link || "",
        episodes: [],
      };

      // Extract episodes
      const items = Array.isArray(channel.item)
        ? channel.item
        : [channel.item].filter(Boolean);

      if (items && items.length > 0) {
        try {
          metadata.episodes = items.map((item: any) => {
            try {
              // Get enclosure URL (audio file)
              const audioUrl = item?.enclosure?.["@_url"] || "";

              // Get duration in seconds
              let duration = 0;
              if (item["itunes:duration"]) {
                try {
                  const durationStr = String(item["itunes:duration"]);
                  if (durationStr.includes(":")) {
                    // Format: HH:MM:SS or MM:SS
                    const parts = durationStr.split(":").map(Number);
                    if (parts.length === 3) {
                      duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    } else if (parts.length === 2) {
                      duration = parts[0] * 60 + parts[1];
                    }
                  } else {
                    // Format: seconds as number
                    duration = parseInt(durationStr, 10) || 0;
                  }
                } catch (error) {
                  console.warn("Error parsing duration:", error);
                  // Try to parse as a number directly
                  if (typeof item["itunes:duration"] === "number") {
                    duration = item["itunes:duration"];
                  }
                }
              }

              // Safely extract guid
              let guid = "";
              try {
                guid = item.guid?.["#text"] || item.guid || item.link || "";
                // Ensure guid is a string
                guid = String(guid);
              } catch (error) {
                console.warn("Error extracting guid:", error);
                // Generate a fallback guid if needed
                guid = `episode-${Math.random().toString(36).substring(2, 15)}`;
              }

              return {
                guid,
                title: item.title || "Untitled Episode",
                description: item.description || item["itunes:summary"] || "",
                audioUrl,
                publishedDate: item.pubDate || "",
                duration,
                imageUrl: item["itunes:image"]?.["@_href"] || undefined,
              };
            } catch (itemError) {
              console.warn("Error parsing episode item:", itemError);
              // Return a minimal valid episode object
              return {
                guid: `error-episode-${Math.random()
                  .toString(36)
                  .substring(2, 15)}`,
                title: "Error parsing episode",
                description: "",
                audioUrl: "",
                publishedDate: "",
                duration: 0,
                imageUrl: undefined,
              };
            }
          });
        } catch (episodesError) {
          console.error("Error parsing episodes:", episodesError);
          metadata.episodes = []; // Ensure we have a valid episodes array
        }
      }

      console.log(
        `Successfully parsed podcast feed with ${metadata.episodes.length} episodes`
      );
      return NextResponse.json(metadata);
    } catch (parseError) {
      console.error("Error parsing podcast feed XML:", parseError);
      return NextResponse.json(
        { error: "Failed to parse podcast feed XML" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching podcast feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcast feed" },
      { status: 500 }
    );
  }
}
