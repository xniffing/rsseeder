import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	googleId: text('google_id').notNull().unique(),
	email: text('email').notNull().unique(),
	name: text('name').notNull(),
	avatar: text('avatar'),
	createdAt: text('created_at').notNull()
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: text('expires_at').notNull()
});

export const feeds = sqliteTable(
	'feeds',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		title: text('title').notNull(),
		description: text('description').notNull().default(''),
		feedUrl: text('feed_url').notNull(),
		siteUrl: text('site_url').notNull(),
		imageUrl: text('image_url'),
		category: text('category').notNull().default('Independent'),
		language: text('language').notNull().default('en'),
		lastSyncedAt: text('last_synced_at').notNull(),
		createdAt: text('created_at').notNull()
	},
	(table) => ({
		userFeedUrlIdx: uniqueIndex('feeds_user_feed_url_idx').on(table.userId, table.feedUrl)
	})
);

export const entries = sqliteTable(
	'entries',
	{
		id: text('id').primaryKey(),
		feedId: text('feed_id')
			.notNull()
			.references(() => feeds.id),
		sourceKey: text('source_key').notNull(),
		title: text('title').notNull(),
		summary: text('summary').notNull().default(''),
		contentText: text('content_text').notNull().default(''),
		contentMarkdown: text('content_markdown').notNull().default(''),
		url: text('url').notNull(),
		publishedAt: text('published_at').notNull(),
		tagsJson: text('tags_json').notNull().default('[]'),
		readAt: text('read_at'),
		createdAt: text('created_at').notNull()
	},
	(table) => ({
		sourceKeyIdx: uniqueIndex('entries_source_key_idx').on(table.sourceKey)
	})
);

export const bookmarks = sqliteTable(
	'bookmarks',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		entryId: text('entry_id')
			.notNull()
			.references(() => entries.id),
		createdAt: text('created_at').notNull()
	},
	(table) => ({
		userEntryIdx: uniqueIndex('bookmarks_user_entry_idx').on(table.userId, table.entryId)
	})
);
