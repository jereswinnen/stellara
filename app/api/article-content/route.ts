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

    // Use Readability to extract the article content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      // If Readability fails, fall back to basic extraction with cheerio
      const $ = cheerio.load(html);
      const content = $("body").html() || "";

      return NextResponse.json({
        content,
        textContent: $("body").text(),
        length: content.length,
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
      { error: "Failed to fetch article content" },
      { status: 500 }
    );
  }
}
