import { and, desc, eq } from 'drizzle-orm';
import {
	DIGEST_CATEGORIES,
	DIGEST_TYPES,
	type ArchiveDigest,
	type ArchiveDigestArticle,
	type DigestCategory,
	type DigestType
} from '$lib/types';
import type { Database } from './db';
import { entries, feeds, homepageDigests } from './db/schema';

const DIGEST_ENTRY_LIMIT_PER_SOURCE = 10;
const DIGEST_MAX_GROUPS = 8;
const DIGEST_PROMPT_VERSION = 2;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini';

type DigestInputArticle = {
	entryId: string;
	feedId: string;
	feedTitle: string;
	title: string;
	summary: string;
	summarySource: 'summary' | 'content' | 'title';
	summaryQuality: 'strong' | 'weak';
	tags: string[];
	publishedAt: string;
	entryUrl: string;
};

type RawDigestArticle = {
	entryId?: unknown;
	whyIncluded?: unknown;
};

type RawDigestGroup = {
	category?: unknown;
	type?: unknown;
	headline?: unknown;
	summary?: unknown;
	articleEntryIds?: unknown;
	articles?: unknown;
};

type RawDigestResponse = {
	overview?: unknown;
	signals?: unknown;
	groups?: unknown;
};

export type HomepageDigestState = {
	digest: ArchiveDigest | null;
	status: string;
	generatedAt: string | null;
	lastError: string | null;
};

function cleanText(input: string, maxLength = 280) {
	return input.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function isWeakSummary(summary: string, title: string) {
	const normalizedSummary = cleanText(summary, 320).toLowerCase();
	const normalizedTitle = cleanText(title, 180).toLowerCase();

	if (!normalizedSummary) return true;
	if (normalizedSummary === normalizedTitle) return true;
	if (normalizedSummary.length < 48) return true;
	if (/^(no summary available|untitled entry|read more|continue reading)$/i.test(normalizedSummary)) {
		return true;
	}

	return false;
}

function buildDigestSummary(summary: string, contentText: string, title: string) {
	const normalizedSummary = cleanText(summary, 320);
	if (!isWeakSummary(normalizedSummary, title)) {
		return {
			summary: normalizedSummary,
			summarySource: 'summary' as const,
			summaryQuality: 'strong' as const
		};
	}

	const normalizedContent = cleanText(contentText, 320);
	if (normalizedContent && !isWeakSummary(normalizedContent, title)) {
		return {
			summary: normalizedContent,
			summarySource: 'content' as const,
			summaryQuality: 'strong' as const
		};
	}

	return {
		summary: cleanText(title, 180),
		summarySource: 'title' as const,
		summaryQuality: 'weak' as const
	};
}

function stripCodeFences(input: string) {
	const trimmed = input.trim();
	if (trimmed.startsWith('```')) {
		return trimmed
			.replace(/^```(?:json)?\s*/i, '')
			.replace(/\s*```$/, '')
			.trim();
	}

	return trimmed;
}

function isDigestCategory(value: string): value is DigestCategory {
	return DIGEST_CATEGORIES.includes(value as DigestCategory);
}

function isDigestType(value: string): value is DigestType {
	return DIGEST_TYPES.includes(value as DigestType);
}

function assertNonEmptyString(value: unknown, field: string): string {
	if (typeof value !== 'string' || !value.trim()) {
		throw new Error(`Invalid digest field: ${field}`);
	}

	return value.trim();
}

function asStringArray(value: unknown, field: string): string[] {
	if (!Array.isArray(value)) {
		throw new Error(`Invalid digest field: ${field}`);
	}

	return value.map((item, index) => assertNonEmptyString(item, `${field}[${index}]`));
}

async function sha256(input: string) {
	const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	return Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

async function getLatestDigestInputArticles(db: Database, userId: string): Promise<DigestInputArticle[]> {
	const rows = await db
		.select({
			entryId: entries.id,
			feedId: entries.feedId,
			feedTitle: feeds.title,
			title: entries.title,
			summary: entries.summary,
			contentText: entries.contentText,
			tagsJson: entries.tagsJson,
			publishedAt: entries.publishedAt,
			entryUrl: entries.url
		})
		.from(entries)
		.innerJoin(feeds, eq(entries.feedId, feeds.id))
		.where(eq(feeds.userId, userId))
		.orderBy(feeds.id, desc(entries.publishedAt), desc(entries.createdAt));

	const counts = new Map<string, number>();
	const selected: DigestInputArticle[] = [];

	for (const row of rows) {
		const seen = counts.get(row.feedId) ?? 0;
		if (seen >= DIGEST_ENTRY_LIMIT_PER_SOURCE) continue;
		counts.set(row.feedId, seen + 1);
		const title = cleanText(row.title, 180);
		const digestSummary = buildDigestSummary(row.summary, row.contentText, title);
		selected.push({
			entryId: row.entryId,
			feedId: row.feedId,
			feedTitle: row.feedTitle,
			title,
			summary: digestSummary.summary,
			summarySource: digestSummary.summarySource,
			summaryQuality: digestSummary.summaryQuality,
			tags: JSON.parse(row.tagsJson || '[]') as string[],
			publishedAt: row.publishedAt,
			entryUrl: row.entryUrl
		});
	}

	return selected.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

async function buildInputSignature(userId: string, articles: DigestInputArticle[]) {
	return sha256(
		JSON.stringify({
			version: DIGEST_PROMPT_VERSION,
			userId,
			articles: articles.map((article) => ({
				entryId: article.entryId,
				publishedAt: article.publishedAt,
				feedId: article.feedId,
				title: article.title,
				summary: article.summary,
				summarySource: article.summarySource,
				summaryQuality: article.summaryQuality,
				tags: article.tags
			}))
		})
	);
}

function getMessageText(content: unknown) {
	if (typeof content === 'string') return content;
	if (Array.isArray(content)) {
		return content
			.map((part) => {
				if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
					return part.text;
				}
				return '';
			})
			.join('')
			.trim();
	}

	return '';
}

async function requestDigestFromOpenRouter(
	env: App.Platform['env'],
	userId: string,
	articles: DigestInputArticle[]
) {
	if (!env.OPENROUTER_API_KEY) {
		throw new Error('OpenRouter is not configured');
	}

	const response = await fetch(OPENROUTER_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
			'content-type': 'application/json',
			'HTTP-Referer': 'https://rsseeder.xniffing.workers.dev',
			'X-Title': 'ARCHIVE'
		},
		body: JSON.stringify({
			model: env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
			temperature: 0.2,
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content:
						'You are an editorial digest classifier and summarizer for an RSS reader. Classify every article using only the fixed category and type taxonomies provided. Cluster related stories across different sources. Write concise, factual, non-hallucinatory summaries. Preserve source diversity inside clusters. Some article summaries are missing, thin, or unreliable. When summaryQuality is weak, rely primarily on the title, tags, feed title, and agreement with other articles. Do not let one weak summary distort an entire category. Return JSON only, with no prose outside the JSON object. Do not invent categories, types, article IDs, titles, or source names.'
				},
				{
					role: 'user',
					content: JSON.stringify({
						version: DIGEST_PROMPT_VERSION,
						userId,
						generatedAt: new Date().toISOString(),
						categories: DIGEST_CATEGORIES,
						types: DIGEST_TYPES,
						constraints: {
							maxGroups: DIGEST_MAX_GROUPS,
							articleReusePolicy: 'Each article should appear in only one primary group.',
							ordering: 'Order groups by editorial importance and recency, not alphabetically.'
						},
						articles: articles.map((article) => ({
							entryId: article.entryId,
							feedTitle: article.feedTitle,
							title: article.title,
							summary: article.summary,
							summarySource: article.summarySource,
							summaryQuality: article.summaryQuality,
							tags: article.tags,
							publishedAt: article.publishedAt,
							entryUrl: article.entryUrl
						})),
						responseShape: {
							overview: 'string',
							signals: ['string'],
							groups: [
								{
									category: 'string from categories list',
									type: 'string from types list',
									headline: 'short editorial headline',
									summary: 'brief factual cluster summary',
									articleEntryIds: ['entry ids included in the group'],
									articles: [{ entryId: 'string', whyIncluded: 'optional short reason' }]
								}
							]
						}
					})
				}
			]
		})
	});

	if (!response.ok) {
		const message = await response.text();
		throw new Error(`OpenRouter request failed: ${response.status} ${message}`);
	}

	const payload = (await response.json()) as {
		choices?: Array<{
			message?: {
				content?: unknown;
			};
		}>;
	};

	const text = getMessageText(payload.choices?.[0]?.message?.content);
	if (!text) {
		throw new Error('OpenRouter returned an empty response');
	}

	return stripCodeFences(text);
}

function validateDigestResponse(userId: string, payload: RawDigestResponse, articleMap: Map<string, DigestInputArticle>): ArchiveDigest {
	const overview = assertNonEmptyString(payload.overview, 'overview');
	const signals = Array.isArray(payload.signals)
		? payload.signals
				.map((item) => (typeof item === 'string' ? item.trim() : ''))
				.filter(Boolean)
				.slice(0, 6)
		: [];

	if (!Array.isArray(payload.groups) || payload.groups.length === 0) {
		throw new Error('Digest response did not contain any groups');
	}

	const seenArticleIds = new Set<string>();
	const groups = payload.groups
		.slice(0, DIGEST_MAX_GROUPS)
		.map((rawGroup, groupIndex): ArchiveDigest['groups'][number] | null => {
			const group = rawGroup as RawDigestGroup;
			const category = assertNonEmptyString(group.category, `groups[${groupIndex}].category`);
			const type = assertNonEmptyString(group.type, `groups[${groupIndex}].type`);
			const headline = assertNonEmptyString(group.headline, `groups[${groupIndex}].headline`);
			const summary = assertNonEmptyString(group.summary, `groups[${groupIndex}].summary`);

			if (!isDigestCategory(category)) {
				throw new Error(`Invalid digest category: ${category}`);
			}

			if (!isDigestType(type)) {
				throw new Error(`Invalid digest type: ${type}`);
			}

			const explicitIds = Array.isArray(group.articleEntryIds)
				? asStringArray(group.articleEntryIds, `groups[${groupIndex}].articleEntryIds`)
				: [];
			const rawArticles = Array.isArray(group.articles) ? (group.articles as RawDigestArticle[]) : [];
			const articleIds = [
				...new Set([
					...explicitIds,
					...rawArticles.map((item) =>
						assertNonEmptyString(item.entryId, `groups[${groupIndex}].articles[].entryId`)
					)
				])
			].filter((entryId) => articleMap.has(entryId));

			if (articleIds.length === 0) {
				return null;
			}

			const articles = articleIds
				.map((entryId) => {
					if (seenArticleIds.has(entryId)) {
						return null;
					}

					const canonicalArticle = articleMap.get(entryId);
					if (!canonicalArticle) {
						return null;
					}

					seenArticleIds.add(entryId);
					const whyIncluded = rawArticles.find((item) => item.entryId === entryId)?.whyIncluded;
					const article: ArchiveDigestArticle = {
						entryId,
						title: canonicalArticle.title,
						feedTitle: canonicalArticle.feedTitle,
						publishedAt: canonicalArticle.publishedAt,
						url: canonicalArticle.entryUrl,
						whyIncluded:
							typeof whyIncluded === 'string' && whyIncluded.trim()
								? cleanText(whyIncluded, 140)
								: undefined
					};
					return article;
				})
				.filter((article) => article !== null) as ArchiveDigestArticle[];

			if (articles.length === 0) {
				return null;
			}

			return {
				category,
				type,
				headline: cleanText(headline, 100),
				summary: cleanText(summary, 360),
				articleCount: articles.length,
				sourceCount: new Set(articles.map((article) => article.feedTitle)).size,
				articles
			};
		})
		.filter((group) => group !== null) as ArchiveDigest['groups'];

	if (groups.length === 0) {
		throw new Error('Digest response did not contain any usable groups');
	}

	return {
		userId,
		generatedAt: new Date().toISOString(),
		inputWindow: {
			perSourceLimit: DIGEST_ENTRY_LIMIT_PER_SOURCE
		},
		sourceCount: new Set([...articleMap.values()].map((article) => article.feedId)).size,
		entryCount: articleMap.size,
		overview: cleanText(overview, 420),
		signals,
		groups
	};
}

async function upsertDigestSuccess(db: Database, userId: string, digest: ArchiveDigest, inputSignature: string) {
	await db
		.insert(homepageDigests)
		.values({
			userId,
			digestJson: JSON.stringify(digest),
			generatedAt: digest.generatedAt,
			inputSignature,
			status: 'ready',
			lastError: null
		})
		.onConflictDoUpdate({
			target: homepageDigests.userId,
			set: {
				digestJson: JSON.stringify(digest),
				generatedAt: digest.generatedAt,
				inputSignature,
				status: 'ready',
				lastError: null
			}
		});
}

async function markDigestFailure(db: Database, userId: string, error: unknown) {
	const message = error instanceof Error ? error.message : 'Unknown digest generation failure';
	await db
		.insert(homepageDigests)
		.values({
			userId,
			status: 'failed',
			lastError: cleanText(message, 500)
		})
		.onConflictDoUpdate({
			target: homepageDigests.userId,
			set: {
				status: 'failed',
				lastError: cleanText(message, 500)
			}
		});
}

async function markDigestPending(db: Database, userId: string, inputSignature: string | null = null) {
	await db
		.insert(homepageDigests)
		.values({
			userId,
			status: 'pending',
			inputSignature,
			lastError: null
		})
		.onConflictDoUpdate({
			target: homepageDigests.userId,
			set: {
				status: 'pending',
				inputSignature,
				lastError: null
			}
		});
}

export async function getHomepageDigestState(db: Database, userId: string): Promise<HomepageDigestState> {
	const row = await db
		.select()
		.from(homepageDigests)
		.where(eq(homepageDigests.userId, userId))
		.limit(1)
		.then((rows) => rows[0] ?? null);

	if (!row) {
		return {
			digest: null,
			status: 'missing',
			generatedAt: null,
			lastError: null
		};
	}

	let digest: ArchiveDigest | null = null;
	if (row.digestJson) {
		try {
			digest = JSON.parse(row.digestJson) as ArchiveDigest;
		} catch (error) {
			console.error(`Unable to parse homepage digest for user ${userId}:`, error);
		}
	}

	return {
		digest,
		status: row.status,
		generatedAt: row.generatedAt ?? null,
		lastError: row.lastError ?? null
	};
}

export async function generateHomepageDigestForUser(
	db: Database,
	env: App.Platform['env'],
	userId: string
): Promise<'generated' | 'failed' | 'skipped'> {
	const articles = await getLatestDigestInputArticles(db, userId);
	const inputSignature = await buildInputSignature(userId, articles);

	if (articles.length === 0) {
		await markDigestPending(db, userId, inputSignature);
		return 'skipped';
	}

	const existing = await db
		.select({ inputSignature: homepageDigests.inputSignature, status: homepageDigests.status })
		.from(homepageDigests)
		.where(eq(homepageDigests.userId, userId))
		.limit(1)
		.then((rows) => rows[0] ?? null);

	if (existing?.inputSignature === inputSignature && existing.status === 'ready') {
		return 'skipped';
	}

	try {
		const rawText = await requestDigestFromOpenRouter(env, userId, articles);
		const parsed = JSON.parse(rawText) as RawDigestResponse;
		const digest = validateDigestResponse(
			userId,
			parsed,
			new Map(articles.map((article) => [article.entryId, article]))
		);
		await upsertDigestSuccess(db, userId, digest, inputSignature);
		return 'generated';
	} catch (error) {
		console.error(`Failed to generate homepage digest for user ${userId}:`, error);
		await markDigestFailure(db, userId, error);
		return 'failed';
	}
}

export async function generateHomepageDigests(
	db: Database,
	env: App.Platform['env']
): Promise<{ users: number; generated: number; failed: number; skipped: number }> {
	const usersWithFeeds = await db.selectDistinct({ userId: feeds.userId }).from(feeds);
	let generated = 0;
	let failed = 0;
	let skipped = 0;

	for (const { userId } of usersWithFeeds) {
		const result = await generateHomepageDigestForUser(db, env, userId);
		if (result === 'generated') generated++;
		else if (result === 'failed') failed++;
		else skipped++;
	}

	return {
		users: usersWithFeeds.length,
		generated,
		failed,
		skipped
	};
}
