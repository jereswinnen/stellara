import { NextRequest, NextResponse } from "next/server";

export interface PodcastSearchResult {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100: string;
  artworkUrl600: string;
  feedUrl: string;
  genres: string[];
  releaseDate: string;
  trackCount: number;
}

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("term");

  if (!term) {
    return NextResponse.json(
      { error: "Search term parameter is required" },
      { status: 400 }
    );
  }

  console.log(`Searching for podcasts with term: "${term}"`);

  try {
    // Direct call to iTunes API
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        term
      )}&media=podcast&limit=20&entity=podcast`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        `iTunes API error: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        {
          error: `Failed to fetch podcast search results: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const text = await response.text();
    console.log(
      `iTunes API response (first 200 chars): ${text.substring(0, 200)}...`
    );

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse iTunes API response as JSON:", e);
      return NextResponse.json(
        { error: "Failed to parse iTunes API response" },
        { status: 500 }
      );
    }

    console.log(`iTunes API returned ${data.resultCount} results`);

    // Map the results to our format
    const podcasts = data.results
      .filter((item: any) => item.kind === "podcast" && item.feedUrl)
      .map((item: any) => ({
        collectionId: item.collectionId,
        collectionName: item.collectionName,
        artistName: item.artistName,
        artworkUrl100: item.artworkUrl100,
        artworkUrl600: item.artworkUrl600,
        feedUrl: item.feedUrl,
        genres: item.genres || [],
        releaseDate: item.releaseDate,
        trackCount: item.trackCount,
      }));

    console.log(`Filtered to ${podcasts.length} podcasts with feed URLs`);

    return NextResponse.json({ podcasts });
  } catch (error) {
    console.error("Error fetching podcast search results:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcast search results" },
      { status: 500 }
    );
  }
}
