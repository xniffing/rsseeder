CREATE TABLE users (
	id TEXT PRIMARY KEY NOT NULL,
	google_id TEXT NOT NULL UNIQUE,
	email TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	avatar TEXT,
	created_at TEXT NOT NULL
);

CREATE TABLE sessions (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL REFERENCES users(id),
	expires_at TEXT NOT NULL
);

CREATE TABLE feeds (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	feed_url TEXT NOT NULL,
	site_url TEXT NOT NULL,
	image_url TEXT,
	category TEXT NOT NULL DEFAULT 'Independent',
	language TEXT NOT NULL DEFAULT 'en',
	last_synced_at TEXT NOT NULL,
	created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX feeds_user_feed_url_idx ON feeds(user_id, feed_url);

CREATE TABLE entries (
	id TEXT PRIMARY KEY NOT NULL,
	feed_id TEXT NOT NULL REFERENCES feeds(id),
	source_key TEXT NOT NULL,
	title TEXT NOT NULL,
	summary TEXT NOT NULL DEFAULT '',
	content_text TEXT NOT NULL DEFAULT '',
	url TEXT NOT NULL,
	published_at TEXT NOT NULL,
	tags_json TEXT NOT NULL DEFAULT '[]',
	read_at TEXT,
	created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX entries_source_key_idx ON entries(source_key);

CREATE TABLE bookmarks (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL REFERENCES users(id),
	entry_id TEXT NOT NULL REFERENCES entries(id),
	created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX bookmarks_user_entry_idx ON bookmarks(user_id, entry_id);
