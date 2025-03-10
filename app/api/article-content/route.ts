import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Enhanced headers for better compatibility with websites
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: "https://www.google.com/",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "cross-site",
      "Cache-Control": "max-age=0",
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    if (!html || html.trim().length === 0) {
      return NextResponse.json(
        { error: "Empty response from server" },
        { status: 422 }
      );
    }

    // Use Readability to extract the article content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document, {
      // Additional Readability options for better extraction
      charThreshold: 20,
      classesToPreserve: ["twitter-tweet", "instagram-media", "youtube-video"],
    });
    const article = reader.parse();

    if (!article || !article.content || article.content.trim().length === 0) {
      // Enhanced fallback extraction with cheerio
      const $ = cheerio.load(html);

      // Remove script, style, and other non-content elements
      $("script, style, meta, link, noscript, iframe").remove();

      // Try to find the main content area
      let content = "";
      const possibleContentSelectors = [
        "article",
        "main",
        ".article",
        ".post",
        ".content",
        "#content",
        "#main",
        ".main-content",
        "[role=main]",
      ];

      for (const selector of possibleContentSelectors) {
        if ($(selector).length > 0) {
          content = $(selector).html() || "";
          break;
        }
      }

      // If no content found with selectors, use body
      if (!content || content.trim().length === 0) {
        content = $("body").html() || "";
      }

      // Clean up the content
      const cleanedContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

      const textContent = $(cleanedContent).text().trim();

      return NextResponse.json({
        content: cleanedContent,
        textContent: textContent,
        length: cleanedContent.length,
        title: $("title").text() || "Untitled",
        excerpt: textContent.substring(0, 200),
      });
    }

    return NextResponse.json({
      content: article.content,
      textContent: article.textContent,
      length: article.length,
      title: article.title,
      excerpt: article.excerpt,
    });
  } catch (error) {
    console.error("Error fetching article content:", error);
    return NextResponse.json(
      { error: "Failed to fetch article content", details: String(error) },
      { status: 500 }
    );
  }
}
