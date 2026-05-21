/**
 * RSS news ticker service.
 * Parses one or more RSS/Atom feeds and returns a flat list of headlines.
 * Feed URLs are configured via RSS_FEEDS (comma-separated).
 */
import Parser from 'rss-parser';
import { config } from '../config';
import { getCache, withCache } from './cache';
import { logger } from '../logger';

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: ['media:thumbnail', 'enclosure'],
  },
});

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string;
}

export interface RssData {
  items: NewsItem[];
  fetchedAt: string;
}

const cache = getCache('rss', config.rss.refreshMinutes * 60);

export async function fetchRssFeeds(): Promise<RssData> {
  return withCache(cache, 'rss', async () => {
    const feeds = config.rss.feeds
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    logger.info(`Fetching ${feeds.length} RSS feed(s)`);

    const results = await Promise.allSettled(
      feeds.map(async (url) => {
        const feed = await parser.parseURL(url);
        const source = feed.title ?? new URL(url).hostname;
        return (feed.items ?? []).slice(0, config.rss.maxItems).map((item) => ({
          title: (item.title ?? '').replace(/\s+/g, ' ').trim(),
          link: item.link ?? '',
          pubDate: item.pubDate ?? item.isoDate ?? null,
          source,
        }));
      }),
    );

    const items: NewsItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        items.push(...result.value);
      } else {
        logger.warn(`RSS fetch failed: ${result.reason}`);
      }
    }

    // Sort by date descending, newest first
    items.sort((a, b) => {
      if (!a.pubDate) return 1;
      if (!b.pubDate) return -1;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    return {
      items: items.slice(0, config.rss.maxItems * feeds.length),
      fetchedAt: new Date().toISOString(),
    };
  });
}
