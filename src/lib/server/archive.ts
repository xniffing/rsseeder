import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';
import type { ArchiveEntry, ArchiveFeed, ArchiveUser, FeedIngestResult } from '$lib/types';
import { demoRecommendations } from './demo';
import { getDb, type Database } from './db';
import { bookmarks, entries, feeds } from './db/schema';

type ParsedFeed = {
	title: string;
	description: string;
	siteUrl: string;
	imageUrl: string | null;
	language: string;
	category: string;
	entries: Array<{
		externalId: string;
		title: string;
		summary: string;
		contentText: string;
		contentMarkdown: string;
		url: string;
		publishedAt: string;
		tags: string[];
	}>;
};

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
	textNodeName: 'value',
	trimValues: true,
	parseTagValue: false,
	parseAttributeValue: false
});

function hasDatabase(platform: App.Platform | undefined): platform is App.Platform {
	return Boolean(platform?.env?.DB);
}

function asArray<T>(value: T | T[] | undefined): T[] {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}

function valueToText(value: unknown): string {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number') return String(value);
	if (!value || typeof value !== 'object') return '';

	const object = value as Record<string, unknown>;

	if (typeof object.value === 'string') return object.value.trim();
	if (typeof object['#text'] === 'string') return String(object['#text']).trim();
	if (typeof object.href === 'string') return object.href.trim();
	if (typeof object.term === 'string') return object.term.trim();

	return '';
}

function stripHtml(input: string) {
	return input
		.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function extractHtmlFragment(html: string, tagName: string) {
	const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
	return pattern.exec(html)?.[1] ?? '';
}

function decodeHtmlEntities(input: string) {
	return input
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#039;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}

function normalizeMarkdownUrl(href: string) {
	try {
		return encodeURI(decodeHtmlEntities(href.trim()));
	} catch {
		return href.trim();
	}
}

function extractMetaContent(html: string, key: string, attribute: 'name' | 'property' = 'name') {
	const pattern = new RegExp(
		`<meta[^>]+${attribute}=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
		'i'
	);
	const reversePattern = new RegExp(
		`<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${key}["'][^>]*>`,
		'i'
	);
	return decodeHtmlEntities(pattern.exec(html)?.[1] ?? reversePattern.exec(html)?.[1] ?? '').trim();
}

function normalizeTextBlock(input: string) {
	return input.replace(/\s+/g, ' ').trim();
}

function normalizeMarkdownWhitespace(markdown: string) {
	return markdown
		.split('\n')
		.map((line) => {
			if (!line.trim()) return '';
			if (/^\s*```/.test(line)) return line.trim();
			if (/^\s{4,}/.test(line) && !/^\s*(?:[-*+]|\d+\.)\s/.test(line) && !/^\s*>/.test(line)) {
				return line.trimStart();
			}
			return line.replace(/\s+$/g, '');
		})
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function htmlToMarkdown(html: string): string {
	return normalizeMarkdownWhitespace(
		html
		.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
		.replace(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi, (_, figureHtml: string) => {
			const imgMatch = /<img\b[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>|<img\b[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/i.exec(
				figureHtml
			);
			const figcaption = stripHtml(extractHtmlFragment(figureHtml, 'figcaption'));
			const src = imgMatch?.[1] ?? imgMatch?.[4] ?? '';
			const alt = imgMatch?.[2] ?? imgMatch?.[3] ?? figcaption;

			if (!src) {
				return `\n\n${figcaption}\n\n`;
			}

			return `\n\n![${alt}](${src})${figcaption ? `\n\n_${figcaption}_` : ''}\n\n`;
		})
		.replace(/<img\b([^>]*)>/gi, (_, attrs: string) => {
			const src = /src=["']([^"']+)["']/i.exec(attrs)?.[1] ?? '';
			const alt = /alt=["']([^"']*)["']/i.exec(attrs)?.[1] ?? '';
			if (!src) return ' ';
			return `\n\n![${alt}](${src})\n\n`;
		})
		.replace(/<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code: string) => {
			return `\n\n\`\`\`\n${decodeHtmlEntities(stripHtml(code))}\n\`\`\`\n\n`;
		})
		.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, quote: string) => {
			const markdownQuote: string = htmlToMarkdown(quote)
				.split('\n')
				.map((line: string) => line.trim())
				.filter(Boolean)
				.map((line: string) => `> ${line}`)
				.join('\n');
			return `\n\n${markdownQuote}\n\n`;
		})
		.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, text: string) => {
			return `\n\n${'#'.repeat(Number(level))} ${stripHtml(text)}\n\n`;
		})
		.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_, listHtml: string) => {
			const items = [...listHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((match, index) => {
				return `${index + 1}. ${stripHtml(match[1])}`;
			});
			return `\n\n${items.join('\n')}\n\n`;
		})
		.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_, listHtml: string) => {
			const items = [...listHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => {
				return `- ${stripHtml(match[1])}`;
			});
			return `\n\n${items.join('\n')}\n\n`;
		})
		.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, text: string) => `\n- ${stripHtml(text)}`)
		.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, text: string) => {
			const label = decodeHtmlEntities(stripHtml(text)) || decodeHtmlEntities(href);
			return `[${label}](${normalizeMarkdownUrl(href)})`;
		})
		.replace(/<(p|div|section|article|main)\b[^>]*>/gi, '\n\n')
		.replace(/<\/(p|div|section|article|main)>/gi, '\n\n')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/?(ul|ol)\b[^>]*>/gi, '\n')
		.replace(/<\/?[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/[ \t]+\n/g, '\n')
		.trim()
	);
}

function removeHtmlBlocks(html: string, pattern: RegExp) {
	let output = html;
	while (pattern.test(output)) {
		output = output.replace(pattern, ' ');
	}
	return output;
}

function removeBoilerplateHtml(html: string) {
	let output = html;

	output = removeHtmlBlocks(
		output,
		/<(script|style|noscript|svg|nav|aside|footer|header|form|button|iframe)\b[\s\S]*?<\/\1>/gi
	);

	// Strip common non-article containers even when they are generic div/section wrappers.
	output = removeHtmlBlocks(
		output,
		/<(div|section|ul|ol)\b[^>]*(id|class)=["'][^"']*(menu|nav|sidebar|footer|header|toc|table-of-contents|share|social|related|recommend|promo|advert|ad-|ads|newsletter|subscribe|comment|reaction|breadcrumb|author-bio|outbrain|taboola)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi
	);

	return output;
}

function getTagBlocks(html: string, tagName: string) {
	const pattern = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
	const blocks: Array<{ attrs: string; innerHtml: string; outerHtml: string }> = [];

	for (const match of html.matchAll(pattern)) {
		blocks.push({
			attrs: match[1] ?? '',
			innerHtml: match[2] ?? '',
			outerHtml: match[0]
		});
	}

	return blocks;
}

function scoreArticleCandidate(attrs: string, innerHtml: string) {
	const text = normalizeTextBlock(stripHtml(innerHtml));
	if (!text) return Number.NEGATIVE_INFINITY;

	const words = text.split(/\s+/).filter(Boolean).length;
	const paragraphs = (innerHtml.match(/<p\b/gi) ?? []).length;
	const headings = (innerHtml.match(/<h[1-6]\b/gi) ?? []).length;
	const listItems = (innerHtml.match(/<li\b/gi) ?? []).length;
	const links = (innerHtml.match(/<a\b/gi) ?? []).length;
	const linkTextLength = normalizeTextBlock(stripHtml(innerHtml.replace(/<(?!a\b)[^>]+>/gi, ' '))).length;
	const linkDensity = text.length ? linkTextLength / text.length : 0;
	const attrPenalty = /(menu|nav|sidebar|footer|header|toc|table-of-contents|share|social|related|recommend|promo|advert|ad-|ads|newsletter|subscribe|comment|reaction|breadcrumb)/i.test(
		attrs
	)
		? 500
		: 0;

	let score = words;
	score += paragraphs * 80;
	score += headings * 20;
	score -= listItems * 25;
	score -= links * 8;
	score -= Math.round(linkDensity * 600);
	score -= attrPenalty;

	return score;
}

function pickBestArticleHtml(html: string) {
	const cleaned = removeBoilerplateHtml(html);
	const candidates = [
		...getTagBlocks(cleaned, 'article'),
		...getTagBlocks(cleaned, 'main'),
		...getTagBlocks(cleaned, 'section'),
		...getTagBlocks(cleaned, 'div')
	];

	let best = '';
	let bestScore = Number.NEGATIVE_INFINITY;

	for (const candidate of candidates) {
		const score = scoreArticleCandidate(candidate.attrs, candidate.innerHtml);
		if (score > bestScore) {
			best = candidate.innerHtml;
			bestScore = score;
		}
	}

	if (best) return best;

	return extractHtmlFragment(cleaned, 'body') || cleaned;
}

function extractArticleTextFromHtml(html: string) {
	const cleaned = removeBoilerplateHtml(html);
	const articleHtml = pickBestArticleHtml(cleaned);

	const title = normalizeTextBlock(
		decodeHtmlEntities(extractHtmlFragment(cleaned, 'title') || extractMetaContent(cleaned, 'og:title', 'property'))
	);
	const summary = normalizeTextBlock(
		extractMetaContent(cleaned, 'description') || extractMetaContent(cleaned, 'og:description', 'property')
	);
	const contentText = normalizeTextBlock(stripHtml(articleHtml));
	const contentMarkdown = htmlToMarkdown(articleHtml);

	return { title, summary, contentText, contentMarkdown };
}

function shouldHydrateFromArticle(entry: ParsedFeed['entries'][number]) {
	if (!entry.url) return false;
	if (entry.contentText.length >= 400) return false;
	if (entry.contentText && entry.contentText.length > entry.summary.length + 120) return false;
	return true;
}

async function fetchArticleContent(url: string) {
	const response = await fetch(url, {
		headers: {
			accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
		},
		redirect: 'follow'
	});

	if (!response.ok) {
		throw new Error(`Article fetch failed with ${response.status}`);
	}

	const contentType = response.headers.get('content-type') ?? '';
	if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
		return null;
	}

	return extractArticleTextFromHtml(await response.text());
}

async function enrichFeedEntries(entries: ParsedFeed['entries']) {
	return Promise.all(
		entries.map(async (entry) => {
			if (!shouldHydrateFromArticle(entry)) {
				return entry;
			}

			try {
				const article = await fetchArticleContent(entry.url);
				if (!article) return entry;

				return {
					...entry,
					title: article.title || entry.title,
					summary: article.summary || entry.summary,
					contentText: article.contentText || entry.contentText || entry.summary,
					contentMarkdown: article.contentMarkdown || entry.contentMarkdown
				};
			} catch {
				return entry;
			}
		})
	);
}

function readingMinutes(text: string) {
	return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 180));
}

function normalizeDate(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function pickAtomLink(link: unknown) {
	for (const item of asArray(link as Record<string, unknown> | Record<string, unknown>[])) {
		if (typeof item === 'string') return item;
		if (item && typeof item === 'object') {
			const record = item as Record<string, unknown>;
			const rel = typeof record.rel === 'string' ? record.rel : 'alternate';
			if ((rel === 'alternate' || rel === 'self') && typeof record.href === 'string') {
				return record.href;
			}
		}
	}

	return '';
}

function pickTags(value: unknown): string[] {
	return asArray(value)
		.map((item) => valueToText(item))
		.filter(Boolean)
		.slice(0, 4);
}

function mapRssFeed(doc: Record<string, unknown>, feedUrl: string): ParsedFeed {
	const channel = (doc.rss as { channel?: Record<string, unknown> } | undefined)?.channel;
	if (!channel) {
		throw new Error('Unsupported RSS document');
	}

	return {
		title: valueToText(channel.title) || new URL(feedUrl).hostname,
		description: stripHtml(valueToText(channel.description)),
		siteUrl: valueToText(channel.link) || feedUrl,
		imageUrl: valueToText((channel.image as Record<string, unknown> | undefined)?.url) || null,
		language: valueToText(channel.language) || 'en',
		category: valueToText(channel.category) || 'Independent',
		entries: asArray(channel.item as Record<string, unknown> | Record<string, unknown>[]).map((item) => {
			const link = valueToText(item.link) || feedUrl;
			const summary = stripHtml(valueToText(item.description));
			const contentText = stripHtml(
				valueToText(item['content:encoded']) || valueToText(item.content) || summary
			);
			const contentMarkdown = htmlToMarkdown(
				valueToText(item['content:encoded']) || valueToText(item.content) || summary
			);

			return {
				externalId: valueToText(item.guid) || link || valueToText(item.title),
				title: valueToText(item.title) || 'Untitled entry',
				summary,
				contentText,
				contentMarkdown,
				url: link,
				publishedAt: normalizeDate(
					valueToText(item.pubDate) || valueToText(item.published) || new Date().toISOString()
				),
				tags: pickTags(item.category)
			};
		})
	};
}

function mapAtomFeed(doc: Record<string, unknown>, feedUrl: string): ParsedFeed {
	const feed = doc.feed as Record<string, unknown> | undefined;
	if (!feed) {
		throw new Error('Unsupported Atom document');
	}

	return {
		title: valueToText(feed.title) || new URL(feedUrl).hostname,
		description: stripHtml(valueToText(feed.subtitle)),
		siteUrl: pickAtomLink(feed.link) || feedUrl,
		imageUrl: valueToText(feed.logo) || null,
		language: valueToText(feed.lang) || 'en',
		category: valueToText(feed.category) || 'Independent',
		entries: asArray(feed.entry as Record<string, unknown> | Record<string, unknown>[]).map((entry) => {
			const link = pickAtomLink(entry.link) || feedUrl;
			const summary = stripHtml(valueToText(entry.summary));
			const contentText = stripHtml(valueToText(entry.content) || summary);
			const contentMarkdown = htmlToMarkdown(valueToText(entry.content) || summary);

			return {
				externalId: valueToText(entry.id) || link || valueToText(entry.title),
				title: valueToText(entry.title) || 'Untitled entry',
				summary,
				contentText,
				contentMarkdown,
				url: link,
				publishedAt: normalizeDate(
					valueToText(entry.published) || valueToText(entry.updated) || new Date().toISOString()
				),
				tags: pickTags(entry.category)
			};
		})
	};
}

async function fetchFeedDocument(feedUrl: string) {
	const response = await fetch(feedUrl, {
		headers: {
			accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
		}
	});

	if (!response.ok) {
		throw new Error(`Feed fetch failed with ${response.status}`);
	}

	const xml = await response.text();
	const parsed = parser.parse(xml) as Record<string, unknown>;

	if (parsed.rss) return mapRssFeed(parsed, feedUrl);
	if (parsed.feed) return mapAtomFeed(parsed, feedUrl);

	throw new Error('Unsupported feed format');
}

function createId(prefix: string) {
	return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;
}

function mapEntryRow(
	row: {
		id: string;
		feedId: string;
		title: string;
		summary: string;
		contentText: string;
		contentMarkdown: string;
		url: string;
		publishedAt: string;
		tagsJson: string;
		readAt: string | null;
		feedTitle: string;
		bookmarkId: string | null;
	},
	overrideBookmarked?: boolean
): ArchiveEntry {
	return {
		id: row.id,
		feedId: row.feedId,
		feedTitle: row.feedTitle,
		title: row.title,
		summary: row.summary,
		contentText: row.contentText,
		contentMarkdown: row.contentMarkdown,
		url: row.url,
		publishedAt: row.publishedAt,
		readingMinutes: readingMinutes(row.contentText || row.summary),
		tags: JSON.parse(row.tagsJson || '[]') as string[],
		bookmarked: overrideBookmarked ?? Boolean(row.bookmarkId),
		status: row.readAt ? 'read' : 'unread'
	};
}

const unreadBoostDays = 5;

async function queryLatestEntries(db: Database, userId: string, limit?: number) {
	const rows = await db
		.select({
			id: entries.id,
			feedId: entries.feedId,
			title: entries.title,
			summary: entries.summary,
			contentText: entries.contentText,
			contentMarkdown: entries.contentMarkdown,
			url: entries.url,
			publishedAt: entries.publishedAt,
			tagsJson: entries.tagsJson,
			readAt: entries.readAt,
			feedTitle: feeds.title,
			bookmarkId: bookmarks.id
		})
		.from(entries)
		.innerJoin(feeds, eq(entries.feedId, feeds.id))
		.leftJoin(bookmarks, and(eq(bookmarks.entryId, entries.id), eq(bookmarks.userId, userId)))
		.where(eq(feeds.userId, userId))
		.orderBy(
			desc(
				sql<number>`julianday(${entries.publishedAt}) + case when ${entries.readAt} is null then ${unreadBoostDays} else 0 end`
			),
			desc(entries.publishedAt)
		)
		.limit(limit ?? 100);

	return rows.map((row) => mapEntryRow(row));
}

async function queryFeedEntries(db: Database, userId: string, offset = 0, limit = 5) {
	const unreadBoostDays = 5;

	const rows = await db
		.select({
			id: entries.id,
			feedId: entries.feedId,
			title: entries.title,
			summary: entries.summary,
			contentText: entries.contentText,
			contentMarkdown: entries.contentMarkdown,
			url: entries.url,
			publishedAt: entries.publishedAt,
			tagsJson: entries.tagsJson,
			readAt: entries.readAt,
			feedTitle: feeds.title,
			bookmarkId: bookmarks.id
		})
		.from(entries)
		.innerJoin(feeds, eq(entries.feedId, feeds.id))
		.leftJoin(bookmarks, and(eq(bookmarks.entryId, entries.id), eq(bookmarks.userId, userId)))
		.where(eq(feeds.userId, userId))
		.orderBy(
			desc(
				sql<number>`julianday(${entries.publishedAt}) + case when ${entries.readAt} is null then ${unreadBoostDays} else 0 end`
			),
			desc(entries.publishedAt)
		)
		.offset(offset)
		.limit(limit);

	return rows.map((row) => mapEntryRow(row));
}

async function querySavedEntries(db: Database, userId: string) {
	const rows = await db
		.select({
			id: entries.id,
			feedId: entries.feedId,
			title: entries.title,
			summary: entries.summary,
			contentText: entries.contentText,
			contentMarkdown: entries.contentMarkdown,
			url: entries.url,
			publishedAt: entries.publishedAt,
			tagsJson: entries.tagsJson,
			readAt: entries.readAt,
			feedTitle: feeds.title,
			bookmarkId: bookmarks.id
		})
		.from(bookmarks)
		.innerJoin(entries, eq(bookmarks.entryId, entries.id))
		.innerJoin(feeds, eq(entries.feedId, feeds.id))
		.where(eq(bookmarks.userId, userId))
		.orderBy(desc(bookmarks.createdAt));

	return rows.map((row) => mapEntryRow(row, true));
}

async function queryFeeds(db: Database, userId: string): Promise<ArchiveFeed[]> {
	const rows = await db
		.select({
			id: feeds.id,
			title: feeds.title,
			description: feeds.description,
			feedUrl: feeds.feedUrl,
			siteUrl: feeds.siteUrl,
			imageUrl: feeds.imageUrl,
			category: feeds.category,
			lastSyncedAt: feeds.lastSyncedAt,
			totalEntries: sql<number>`count(${entries.id})`,
			unreadCount: sql<number>`sum(case when ${entries.readAt} is null and ${entries.id} is not null then 1 else 0 end)`
		})
		.from(feeds)
		.leftJoin(entries, eq(entries.feedId, feeds.id))
		.where(eq(feeds.userId, userId))
		.groupBy(feeds.id)
		.orderBy(desc(feeds.lastSyncedAt));

	return rows.map((row) => ({
		...row,
		imageUrl: row.imageUrl ?? null,
		totalEntries: Number(row.totalEntries ?? 0),
		unreadCount: Number(row.unreadCount ?? 0)
	}));
}

async function queryEntry(db: Database, userId: string, entryId: string) {
	const rows = await db
		.select({
			id: entries.id,
			feedId: entries.feedId,
			title: entries.title,
			summary: entries.summary,
			contentText: entries.contentText,
			contentMarkdown: entries.contentMarkdown,
			url: entries.url,
			publishedAt: entries.publishedAt,
			tagsJson: entries.tagsJson,
			readAt: entries.readAt,
			feedTitle: feeds.title,
			bookmarkId: bookmarks.id
		})
		.from(entries)
		.innerJoin(feeds, eq(entries.feedId, feeds.id))
		.leftJoin(bookmarks, and(eq(bookmarks.entryId, entries.id), eq(bookmarks.userId, userId)))
		.where(and(eq(entries.id, entryId), eq(feeds.userId, userId)))
		.limit(1);

	return rows[0] ? mapEntryRow(rows[0]) : null;
}

export async function getHomepageData(platform: App.Platform | undefined, user: ArchiveUser | null) {
	if (!hasDatabase(platform) || !user) {
		return {
			usingDemo: true,
			entries: [] as ArchiveEntry[],
			feeds: [] as ArchiveFeed[]
		};
	}

	const db = getDb(platform.env.DB);
	return {
		usingDemo: false,
		entries: await queryLatestEntries(db, user.id, 12),
		feeds: await queryFeeds(db, user.id)
	};
}

export async function getFeedPageData(platform: App.Platform | undefined, user: ArchiveUser | null, offset = 0, limit = 5) {
	if (!hasDatabase(platform) || !user) {
		return { usingDemo: true, entries: [] as ArchiveEntry[] };
	}

	const db = getDb(platform.env.DB);
	return { usingDemo: false, entries: await queryFeedEntries(db, user.id, offset, limit) };
}

export async function getLibraryPageData(platform: App.Platform | undefined, user: ArchiveUser | null) {
	if (!hasDatabase(platform) || !user) {
		return { usingDemo: true, feeds: [] as ArchiveFeed[] };
	}

	const db = getDb(platform.env.DB);
	return { usingDemo: false, feeds: await queryFeeds(db, user.id) };
}

export async function getDiscoverPageData(platform: App.Platform | undefined, user: ArchiveUser | null) {
	if (!hasDatabase(platform) || !user) {
		return {
			usingDemo: true,
			recommendations: demoRecommendations,
			currentFeeds: [] as ArchiveFeed[]
		};
	}

	const db = getDb(platform.env.DB);
	return {
		usingDemo: false,
		recommendations: demoRecommendations,
		currentFeeds: await queryFeeds(db, user.id)
	};
}

export async function getSavedPageData(platform: App.Platform | undefined, user: ArchiveUser | null) {
	if (!hasDatabase(platform) || !user) {
		return { usingDemo: true, entries: [] as ArchiveEntry[] };
	}

	const db = getDb(platform.env.DB);
	return { usingDemo: false, entries: await querySavedEntries(db, user.id) };
}

export async function getEntryPageData(
	platform: App.Platform | undefined,
	user: ArchiveUser | null,
	entryId: string
) {
	if (!hasDatabase(platform) || !user) {
		return { usingDemo: true, entry: null };
	}

	const db = getDb(platform.env.DB);
	await db
		.update(entries)
		.set({ readAt: new Date().toISOString() })
		.where(and(eq(entries.id, entryId), sql`${entries.readAt} is null`));

	return {
		usingDemo: false,
		entry: await queryEntry(db, user.id, entryId)
	};
}

export async function listFeedsApi(platform: App.Platform | undefined, user: ArchiveUser | null) {
	if (!hasDatabase(platform) || !user) return [] as ArchiveFeed[];
	return queryFeeds(getDb(platform.env.DB), user.id);
}

export async function listEntriesApi(platform: App.Platform | undefined, user: ArchiveUser | null) {
	if (!hasDatabase(platform) || !user) return [] as ArchiveEntry[];
	return queryLatestEntries(getDb(platform.env.DB), user.id);
}

export async function addFeedFromUrl(
	platform: App.Platform | undefined,
	user: ArchiveUser | null,
	input: { url: string; category?: string }
): Promise<FeedIngestResult> {
	if (!hasDatabase(platform) || !user) {
		throw new Error('Database is not configured');
	}

	const feedUrl = input.url.trim();
	if (!feedUrl) throw new Error('Feed URL is required');

	const db = getDb(platform.env.DB);
	const parsed = await fetchFeedDocument(feedUrl);
	const parsedEntries = await enrichFeedEntries(parsed.entries);
	const now = new Date().toISOString();
	const existingFeed = await db
		.select()
		.from(feeds)
		.where(and(eq(feeds.userId, user.id), eq(feeds.feedUrl, feedUrl)))
		.limit(1);

	const feedId = existingFeed[0]?.id ?? createId('feed');
	const category = input.category?.trim() || parsed.category || 'Independent';

	if (existingFeed[0]) {
		await db
			.update(feeds)
			.set({
				title: parsed.title,
				description: parsed.description,
				siteUrl: parsed.siteUrl,
				imageUrl: parsed.imageUrl,
				category,
				language: parsed.language,
				lastSyncedAt: now
			})
			.where(eq(feeds.id, feedId));
	} else {
		await db.insert(feeds).values({
			id: feedId,
			userId: user.id,
			title: parsed.title,
			description: parsed.description,
			feedUrl,
			siteUrl: parsed.siteUrl,
			imageUrl: parsed.imageUrl,
			category,
			language: parsed.language,
			lastSyncedAt: now,
			createdAt: now
		});
	}

	for (const entry of parsedEntries) {
		const record = {
			id: createId('entry'),
			feedId,
			sourceKey: `${feedId}:${entry.externalId}`,
			title: entry.title,
			summary: entry.summary,
			contentText: entry.contentText,
			contentMarkdown: entry.contentMarkdown,
			url: entry.url,
			publishedAt: entry.publishedAt,
			tagsJson: JSON.stringify(entry.tags),
			readAt: null,
			createdAt: now
		};

		await db
			.insert(entries)
			.values(record)
			.onConflictDoUpdate({
				target: entries.sourceKey,
				set: {
					title: record.title,
					summary: record.summary,
					contentText: record.contentText,
					contentMarkdown: record.contentMarkdown,
					url: record.url,
					publishedAt: record.publishedAt,
					tagsJson: record.tagsJson
				}
			});
	}

	const [feed] = await queryFeeds(db, user.id).then((items) => items.filter((item) => item.id === feedId));

	return {
		feed,
		ingestedCount: parsedEntries.length
	};
}

export async function deleteFeed(
	platform: App.Platform | undefined,
	user: ArchiveUser | null,
	feedId: string
) {
	if (!hasDatabase(platform) || !user) {
		throw new Error('Database is not configured');
	}

	const db = getDb(platform.env.DB);
	const existing = await db
		.select()
		.from(feeds)
		.where(and(eq(feeds.id, feedId), eq(feeds.userId, user.id)))
		.limit(1);

	if (!existing[0]) {
		throw new Error('Feed not found');
	}

	const entriesToDelete = await db
		.select({ id: entries.id })
		.from(entries)
		.where(eq(entries.feedId, feedId));

	const entryIds = entriesToDelete.map((row) => row.id);

	if (entryIds.length) {
		await db.delete(bookmarks).where(inArray(bookmarks.entryId, entryIds));
		await db.delete(entries).where(eq(entries.feedId, feedId));
	}

	await db.delete(feeds).where(eq(feeds.id, feedId));
}

export async function syncFeedById(platform: App.Platform | undefined, user: ArchiveUser | null, feedId: string) {
	if (!hasDatabase(platform) || !user) {
		throw new Error('Database is not configured');
	}

	const db = getDb(platform.env.DB);
	const existing = await db
		.select()
		.from(feeds)
		.where(and(eq(feeds.id, feedId), eq(feeds.userId, user.id)))
		.limit(1);

	if (!existing[0]) {
		throw new Error('Feed not found');
	}

	return addFeedFromUrl(platform, user, {
		url: existing[0].feedUrl,
		category: existing[0].category
	});
}

export async function addBookmark(platform: App.Platform | undefined, user: ArchiveUser | null, entryId: string) {
	if (!hasDatabase(platform) || !user) throw new Error('Database is not configured');

	const db = getDb(platform.env.DB);
	await db
		.insert(bookmarks)
		.values({
			id: createId('bookmark'),
			userId: user.id,
			entryId,
			createdAt: new Date().toISOString()
		})
		.onConflictDoNothing();
}

export async function removeBookmark(platform: App.Platform | undefined, user: ArchiveUser | null, entryId: string) {
	if (!hasDatabase(platform) || !user) throw new Error('Database is not configured');

	const db = getDb(platform.env.DB);
	await db
		.delete(bookmarks)
		.where(and(eq(bookmarks.userId, user.id), eq(bookmarks.entryId, entryId)));
}

export async function syncAllFeeds(db: Database): Promise<{ synced: number; errors: number }> {
	const allFeeds = await db.select().from(feeds).orderBy(feeds.lastSyncedAt);

	let synced = 0;
	let errors = 0;

	for (const feed of allFeeds) {
		try {
			const parsed = await fetchFeedDocument(feed.feedUrl);
			const parsedEntries = await enrichFeedEntries(parsed.entries);
			const now = new Date().toISOString();

			await db
				.update(feeds)
				.set({
					title: parsed.title,
					description: parsed.description,
					siteUrl: parsed.siteUrl,
					imageUrl: parsed.imageUrl,
					category: feed.category || parsed.category || 'Independent',
					language: parsed.language,
					lastSyncedAt: now
				})
				.where(eq(feeds.id, feed.id));

			for (const entry of parsedEntries) {
				const record = {
					id: createId('entry'),
					feedId: feed.id,
					sourceKey: `${feed.id}:${entry.externalId}`,
					title: entry.title,
					summary: entry.summary,
					contentText: entry.contentText,
					contentMarkdown: entry.contentMarkdown,
					url: entry.url,
					publishedAt: entry.publishedAt,
					tagsJson: JSON.stringify(entry.tags),
					readAt: null,
					createdAt: now
				};

				await db
					.insert(entries)
					.values(record)
					.onConflictDoUpdate({
						target: entries.sourceKey,
						set: {
							title: record.title,
							summary: record.summary,
							contentText: record.contentText,
							contentMarkdown: record.contentMarkdown,
							url: record.url,
							publishedAt: record.publishedAt,
							tagsJson: record.tagsJson
						}
					});
			}

			synced++;
		} catch (err) {
			console.error(`Failed to sync feed ${feed.id} (${feed.feedUrl}):`, err);
			errors++;
		}
	}

	return { synced, errors };
}
