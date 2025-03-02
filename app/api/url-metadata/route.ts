import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DashboardBot/1.0; +https://yourdomain.com)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const metadata = {
      title:
        $("title").text() ||
        $('meta[property="og:title"]').attr("content") ||
        "",
      description:
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "",
      image:
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        $('link[rel="image_src"]').attr("href") ||
        "",
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error fetching URL metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch URL metadata" },
      { status: 500 }
    );
  }
}
