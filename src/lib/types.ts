export interface ArchiveUser {
	id: string;
	email: string;
	name: string;
	avatar: string | null;
}

export interface ArchiveEntry {
	id: string;
	feedId: string;
	feedTitle: string;
	title: string;
	summary: string;
	contentText: string;
	contentMarkdown: string;
	url: string;
	publishedAt: string;
	readingMinutes: number;
	tags: string[];
	bookmarked: boolean;
	status: 'unread' | 'read';
}

export interface ArchiveFeed {
	id: string;
	title: string;
	description: string;
	feedUrl: string;
	siteUrl: string;
	imageUrl: string | null;
	category: string;
	lastSyncedAt: string;
	totalEntries: number;
	unreadCount: number;
}

export interface Recommendation {
	title: string;
	category: string;
	description: string;
	subscribers: string;
	suggestionUrl: string;
}

export interface FeedIngestResult {
	feed: ArchiveFeed;
	ingestedCount: number;
}

export const DIGEST_CATEGORIES = [
	'Politics',
	'World',
	'Business',
	'Technology',
	'AI',
	'Science',
	'Security',
	'Culture',
	'Design',
	'Media',
	'Health',
	'Environment',
	'Society',
	'Ideas',
	'Markets',
	'Policy',
	'Startups',
	'Open Source',
	'Miscellaneous'
] as const;

export const DIGEST_TYPES = [
	'News',
	'Brief',
	'Analysis',
	'Essay',
	'Opinion',
	'Interview',
	'Review',
	'Report',
	'Explainer',
	'Feature'
] as const;

export type DigestCategory = (typeof DIGEST_CATEGORIES)[number];
export type DigestType = (typeof DIGEST_TYPES)[number];

export interface ArchiveDigestArticle {
	entryId: string;
	title: string;
	feedTitle: string;
	publishedAt: string;
	url: string;
	whyIncluded?: string;
}

export interface ArchiveDigestGroup {
	category: DigestCategory;
	type: DigestType;
	headline: string;
	summary: string;
	articleCount: number;
	sourceCount: number;
	articles: ArchiveDigestArticle[];
}

export interface ArchiveDigest {
	userId: string;
	generatedAt: string;
	inputWindow: {
		perSourceLimit: number;
	};
	sourceCount: number;
	entryCount: number;
	overview: string;
	signals: string[];
	groups: ArchiveDigestGroup[];
}
