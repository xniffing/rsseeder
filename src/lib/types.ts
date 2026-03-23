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
