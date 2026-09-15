/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck — page.evaluate() callbacks run in browser context and need DOM types
// that aren't available in the Node.js tsconfig. This is expected for Playwright scrapers.
/**
 * Playwright scraper for Brooklyn Cat Cafe (bkcatcafe.com).
 *
 * Launches headless Chromium, navigates to the adoptable-cats page,
 * extracts each cat's profile data, runs keyword extraction, and
 * upserts results into the `cats` Postgres table.
 *
 * Run with:  npm run scrape
 */

import { chromium, type Page } from "playwright";
import { pool } from "../db/pool";
import { extractKeywords } from "../scraper/keywords";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface ScrapedCat {
  name: string;
  description: string;
  imageUrl: string | null;
  adoptionUrl: string;
}

// ────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────

/** Base URL for the cafe site */
const BASE_URL = "https://www.catcafebk.com";

/**
 * Candidate paths to the adoptable cats listing page.
 * The scraper will try each in order and use the first one that contains
 * recognisable cat profile markup.
 */
const CANDIDATE_PATHS = [
  "/adoptable-cats",
  "/adopt",
  "/cats",
  "/our-cats",
  "/available-cats",
  "/adoptable",
];

/** Maximum time (ms) to wait for the page to load. */
const NAV_TIMEOUT = 30_000;

/** Maximum time (ms) to wait for dynamic content to appear. */
const CONTENT_TIMEOUT = 10_000;

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/**
 * Try several candidate URLs until we find the one that contains cat
 * listings.  Returns the URL that worked, or throws if none did.
 */
async function discoverCatsPage(page: Page): Promise<string> {
  for (const path of CANDIDATE_PATHS) {
    const url = `${BASE_URL}${path}`;
    console.log(`[scraper] trying ${url} ...`);
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT,
    });

    if (!response || response.status() >= 400) {
      console.log(
        `[scraper]   -> ${response?.status() ?? "no response"}, skipping`,
      );
      continue;
    }

    // Wait a moment for any dynamic / JS-rendered content
    await page.waitForTimeout(2000);

    // Check for common gallery / card layouts that contain cat profiles
    const hasContent = await page.evaluate(() => {
      // Squarespace summary blocks, gallery items, blog items, or generic
      // card layouts that are commonly used for pet profiles.
      const selectors = [
        ".summary-item",
        ".gallery-item",
        ".blog-item",
        ".portfolio-item",
        ".sqs-gallery-design-grid-slide",
        ".sqs-gallery-block-grid .slide",
        '[class*="cat"]',
        '[class*="pet"]',
        '[class*="animal"]',
        ".collection-item",
        ".w-dyn-item", // Webflow dynamic items
        "article",
      ];
      for (const sel of selectors) {
        if (document.querySelectorAll(sel).length >= 2) {
          return true;
        }
      }
      // Fallback: look for multiple images that could be cat photos
      const images = document.querySelectorAll("img");
      return images.length >= 4;
    });

    if (hasContent) {
      console.log(`[scraper]   -> found content at ${url}`);
      return url;
    }

    console.log(`[scraper]   -> no recognisable cat listings, skipping`);
  }

  // Last resort: just use /adoptable-cats (the most common path)
  const fallback = `${BASE_URL}/adoptable-cats`;
  console.warn(`[scraper] no candidate matched; falling back to ${fallback}`);
  return fallback;
}

/**
 * Extract cat profiles from the current page.
 *
 * The function tries multiple DOM strategies in order, from most-specific
 * (known Squarespace summary blocks) to most-generic (any card-like
 * elements with an image + heading).
 */
async function extractCatsFromPage(page: Page): Promise<ScrapedCat[]> {
  // Wait for any lazy-loaded content
  await autoScroll(page);
  await page.waitForTimeout(1500);

  const cats = await page.evaluate((baseUrl: string) => {
    const results: {
      name: string;
      description: string;
      imageUrl: string | null;
      adoptionUrl: string;
    }[] = [];

    // ── Utility helpers ──────────────────────────────────

    /** Get visible text content, trimmed. */
    function text(el: Element | null): string {
      return el?.textContent?.trim() ?? "";
    }

    /** Resolve a possibly-relative URL against the base. */
    function resolveUrl(href: string | null | undefined): string {
      if (!href) return baseUrl;
      try {
        return new URL(href, baseUrl).href;
      } catch {
        return baseUrl;
      }
    }

    /** Extract the best image src from an element or its children. */
    function findImage(container: Element): string | null {
      // data-src (lazy load), then src, then background-image
      const img = container.querySelector("img");
      if (img) {
        const src =
          img.getAttribute("data-src") || img.getAttribute("src") || "";
        if (src && !src.startsWith("data:")) return resolveUrl(src);
      }
      // Check for background-image in inline styles
      const bgEl =
        container.querySelector('[style*="background-image"]') || container;
      const style = bgEl.getAttribute("style") || "";
      const match = style.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/);
      if (match?.[1]) return resolveUrl(match[1]);
      return null;
    }

    // ── Strategy 1: Squarespace summary / blog items ────
    const summaryItems = document.querySelectorAll(
      ".summary-item, .blog-item, .portfolio-item",
    );
    if (summaryItems.length >= 2) {
      summaryItems.forEach((item) => {
        const titleEl = item.querySelector(
          ".summary-title a, .summary-title, h2 a, h3 a, h2, h3",
        );
        const name = text(titleEl);
        if (!name) return;

        const excerptEl = item.querySelector(
          ".summary-excerpt, .summary-content, .blog-excerpt, p",
        );
        const description = text(excerptEl);

        const link = item.querySelector("a")?.getAttribute("href") ?? null;

        results.push({
          name,
          description,
          imageUrl: findImage(item),
          adoptionUrl: resolveUrl(link),
        });
      });
      return results;
    }

    const gallerySlides = document.querySelectorAll(
      ".sqs-gallery-design-grid-slide, .slide, .sqs-gallery-block-grid .slide",
    );
    if (gallerySlides.length >= 2) {
      gallerySlides.forEach((slide) => {
        const meta = slide.querySelector(
          ".slide-meta, .gallery-item-info, .image-slide-title",
        );
        const titleEl =
          meta?.querySelector("h3, h2, p, .image-slide-title") || meta;
        const name = text(titleEl);
        if (!name) return;

        const descEl = slide.querySelector(
          ".slide-description, .gallery-item-description, p:nth-child(2)",
        );
        const description = text(descEl);

        const link = slide.querySelector("a")?.getAttribute("href") ?? null;

        results.push({
          name,
          description,
          imageUrl: findImage(slide),
          adoptionUrl: resolveUrl(link),
        });
      });
      return results;
    }

    // ── Strategy 3: Webflow dynamic list items ──────────
    const dynItems = document.querySelectorAll(".w-dyn-item, .collection-item");
    if (dynItems.length >= 2) {
      dynItems.forEach((item) => {
        const titleEl = item.querySelector(
          'h2, h3, h4, [class*="name"], [class*="title"]',
        );
        const name = text(titleEl);
        if (!name) return;

        const descEl = item.querySelector(
          'p, [class*="desc"], [class*="bio"], [class*="excerpt"]',
        );
        const description = text(descEl);

        const link = item.querySelector("a")?.getAttribute("href") ?? null;

        results.push({
          name,
          description,
          imageUrl: findImage(item),
          adoptionUrl: resolveUrl(link),
        });
      });
      return results;
    }

    // ── Strategy 4: Generic card/article layout ─────────
    const cards = document.querySelectorAll(
      'article, [class*="card"], [class*="item"], [class*="entry"]',
    );
    if (cards.length >= 2) {
      cards.forEach((card) => {
        const titleEl = card.querySelector(
          'h1, h2, h3, h4, [class*="title"], [class*="name"]',
        );
        const name = text(titleEl);
        if (!name) return;

        const descEl = card.querySelector(
          'p, [class*="desc"], [class*="excerpt"], [class*="bio"]',
        );
        const description = text(descEl);

        const link = card.querySelector("a")?.getAttribute("href") ?? null;

        results.push({
          name,
          description,
          imageUrl: findImage(card),
          adoptionUrl: resolveUrl(link),
        });
      });
      return results;
    }

    return results;
  }, BASE_URL);

  return cats;
}

/**
 * If individual cat pages exist, navigate to each and scrape a fuller
 * description.  Only fetches pages whose URL differs from the listing page.
 */
async function enrichDescriptions(
  page: Page,
  cats: ScrapedCat[],
  listingUrl: string,
): Promise<ScrapedCat[]> {
  const enriched: ScrapedCat[] = [];

  for (const cat of cats) {
    // Skip if adoption URL is just the base or the listing page
    if (
      cat.adoptionUrl === BASE_URL ||
      cat.adoptionUrl === listingUrl ||
      cat.adoptionUrl === `${listingUrl}/`
    ) {
      enriched.push(cat);
      continue;
    }

    try {
      console.log(`[scraper] enriching "${cat.name}" from ${cat.adoptionUrl}`);
      await page.goto(cat.adoptionUrl, {
        waitUntil: "domcontentloaded",
        timeout: NAV_TIMEOUT,
      });
      await page.waitForTimeout(1500);

      const detail = await page.evaluate(() => {
        // Grab the longest paragraph block — that is usually the bio
        const paragraphs = Array.from(document.querySelectorAll("p"));
        const longText = paragraphs
          .map((p) => p.textContent?.trim() ?? "")
          .filter((t) => t.length > 30)
          .join(" ");

        // Also try entry-content / post-body blocks
        const contentBlock =
          document
            .querySelector(
              '.entry-content, .blog-item-content, .sqs-block-content, .post-body, article, [class*="description"], [class*="bio"]',
            )
            ?.textContent?.trim() ?? "";

        return longText.length > contentBlock.length ? longText : contentBlock;
      });

      if (detail && detail.length > cat.description.length) {
        enriched.push({ ...cat, description: detail });
      } else {
        enriched.push(cat);
      }
    } catch (err) {
      console.warn(`[scraper] failed to enrich "${cat.name}":`, err);
      enriched.push(cat);
    }
  }

  return enriched;
}

/**
 * Scroll the page to the bottom to trigger lazy-loading images / cards.
 */
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 150);
      // Safety timeout
      setTimeout(() => {
        clearInterval(timer);
        resolve();
      }, 8000);
    });
  });
}

// ────────────────────────────────────────────────────────────
// Database operations
// ────────────────────────────────────────────────────────────

async function upsertCat(cat: ScrapedCat, keywords: string[]): Promise<void> {
  await pool.query(
    `INSERT INTO cats (name, description, keywords, adoption_url, image_url, scraped_at, active)
         VALUES ($1, $2, $3, $4, $5, NOW(), TRUE)
         ON CONFLICT (name) DO UPDATE SET
             description  = EXCLUDED.description,
             keywords     = EXCLUDED.keywords,
             adoption_url = EXCLUDED.adoption_url,
             image_url    = EXCLUDED.image_url,
             scraped_at   = NOW(),
             active       = TRUE`,
    [cat.name, cat.description, keywords, cat.adoptionUrl, cat.imageUrl],
  );
}

async function deactivateMissing(scrapedNames: string[]): Promise<void> {
  if (scrapedNames.length === 0) return;

  await pool.query(
    `UPDATE cats SET active = FALSE
         WHERE name != ALL($1::text[]) AND active = TRUE`,
    [scrapedNames],
  );
}

// ────────────────────────────────────────────────────────────
// Main entry point
// ────────────────────────────────────────────────────────────

export async function scrapeCats(): Promise<void> {
  console.log("[scraper] starting …");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(CONTENT_TIMEOUT);

  try {
    // 1. Find the correct listing page
    const listingUrl = await discoverCatsPage(page);
    await page.goto(listingUrl, {
      waitUntil: "networkidle",
      timeout: NAV_TIMEOUT,
    });

    // 2. Extract cat cards from the listing
    let cats = await extractCatsFromPage(page);
    console.log(`[scraper] found ${cats.length} cat(s) on listing page`);

    if (cats.length === 0) {
      console.error(
        "[scraper] ERROR: no cats found — the site structure may have changed. " +
          "Please inspect the page manually and update selectors.",
      );
      return;
    }

    // 3. Enrich descriptions from individual detail pages (if available)
    cats = await enrichDescriptions(page, cats, listingUrl);

    // 4. Extract keywords and upsert each cat
    const scrapedNames: string[] = [];
    for (const cat of cats) {
      const keywords = extractKeywords(cat.description);
      scrapedNames.push(cat.name);

      console.log(
        `[scraper] upserting "${cat.name}" with tags: [${keywords.join(", ")}]`,
      );

      if (keywords.length === 0) {
        console.warn(
          `[scraper] WARNING: "${cat.name}" matched zero keyword tags. ` +
            "Consider reviewing the description and updating patterns.",
        );
      }

      await upsertCat(cat, keywords);
    }

    // 5. Mark cats that were not found in this scrape as inactive
    await deactivateMissing(scrapedNames);

    console.log(
      `[scraper] done — ${scrapedNames.length} cat(s) upserted, ` +
        "stale entries marked inactive.",
    );
  } catch (err) {
    console.error("[scraper] fatal error:", err);
    throw err;
  } finally {
    await browser.close();
    await pool.end();
  }
}

// ────────────────────────────────────────────────────────────
// CLI entry
// ────────────────────────────────────────────────────────────

// When run directly via `npm run scrape` / `ts-node src/scraper/scrape.ts`
if (require.main === module) {
  scrapeCats()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
