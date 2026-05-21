/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Scraper Service
 * ═══════════════════════════════════════════
 * Utilities for web scraping, RSS parsing, and API fetching.
 * Used by the Collector Agent.
 */

import * as cheerio from 'cheerio';
import Parser from 'rss-parser';
import { createLogger } from '../utils/logger';
import { ScraperError } from '../utils/errors';

const log = createLogger('scraper-service');

/** Result of a scraping operation */
export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  publishedAt?: Date;
  metadata: Record<string, unknown>;
}

export class ScraperService {
  private readonly rssParser: Parser;
  private readonly userAgent: string;

  constructor() {
    this.rssParser = new Parser({
      timeout: 15_000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
    });
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
  }

  /**
   * Scrape a web page and extract clean text content.
   */
  async scrapeWebPage(url: string): Promise<ScrapedContent> {
    try {
      log.info({ url }, 'Scraping web page');

      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new ScraperError(`HTTP ${response.status}: ${response.statusText}`, { url });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove scripts, styles, navs
      $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();

      const title = $('title').text().trim() || $('h1').first().text().trim();
      const content = $('article, main, .content, .post-content, body')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      return {
        url,
        title,
        content: content.slice(0, 50_000), // Cap content length
        metadata: {
          scrapedAt: new Date().toISOString(),
          contentLength: content.length,
        },
      };
    } catch (error) {
      if (error instanceof ScraperError) throw error;
      throw new ScraperError(`Failed to scrape ${url}: ${(error as Error).message}`, { url });
    }
  }

  /**
   * Parse an RSS feed and return all entries.
   */
  async parseRSSFeed(feedUrl: string): Promise<ScrapedContent[]> {
    try {
      log.info({ feedUrl }, 'Parsing RSS feed');

      const feed = await this.rssParser.parseURL(feedUrl);

      return (feed.items ?? []).map((item) => ({
        url: item.link ?? feedUrl,
        title: item.title ?? 'Untitled',
        content: this.stripHtml(item.contentSnippet ?? item.content ?? ''),
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        metadata: {
          feedTitle: feed.title,
          author: item.creator ?? item['author'],
          categories: item.categories,
        },
      }));
    } catch (error) {
      throw new ScraperError(
        `Failed to parse RSS feed ${feedUrl}: ${(error as Error).message}`,
        { feedUrl }
      );
    }
  }

  /**
   * Fetch data from a JSON API endpoint.
   */
  async fetchAPI<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    try {
      log.info({ url }, 'Fetching API');

      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          ...options?.headers,
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new ScraperError(`API ${response.status}: ${response.statusText}`, { url });
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ScraperError) throw error;
      throw new ScraperError(`API fetch failed for ${url}: ${(error as Error).message}`, { url });
    }
  }

  /** Strip HTML tags from content */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

/** Default singleton */
export const scraperService = new ScraperService();
