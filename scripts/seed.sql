INSERT INTO users (id, google_id, email, name, avatar, created_at)
VALUES (
	'user_demo',
	'google_demo',
	'reader@example.com',
	'Archive Reader',
	NULL,
	datetime('now')
);

INSERT INTO feeds (
	id,
	user_id,
	title,
	description,
	feed_url,
	site_url,
	image_url,
	category,
	language,
	last_synced_at,
	created_at
) VALUES
(
	'feed_seed_atlantic',
	'user_demo',
	'The Atlantic',
	'Ideas, politics, culture, and essays for deliberate reading.',
	'https://example.com/atlantic/feed.xml',
	'https://example.com/atlantic',
	NULL,
	'Essentials',
	'en',
	datetime('now'),
	datetime('now')
),
(
	'feed_seed_verge',
	'user_demo',
	'The Verge',
	'Technology, platforms, and the mechanics of digital life.',
	'https://example.com/verge/feed.xml',
	'https://example.com/verge',
	NULL,
	'Tech & Logic',
	'en',
	datetime('now'),
	datetime('now')
);

INSERT INTO entries (
	id,
	feed_id,
	source_key,
	title,
	summary,
	content_text,
	url,
	published_at,
	tags_json,
	read_at,
	created_at
) VALUES
(
	'entry_seed_1',
	'feed_seed_atlantic',
	'feed_seed_atlantic:architecture-of-silence',
	'The Architecture of Silence: Designing for Focus in the Age of Noise',
	'Designers are returning to quiet, structural interfaces that protect concentration.',
	'In the quietest corners of our digital existence, there remains a profound craving for the tactile.',
	'https://example.com/articles/architecture-of-silence',
	datetime('now'),
	'["Architecture","Culture"]',
	NULL,
	datetime('now')
),
(
	'entry_seed_2',
	'feed_seed_verge',
	'feed_seed_verge:neural-ink',
	'Neural Ink: The Subtle Art of Biological Data Storage',
	'Synthetic biologists are treating living systems as archives.',
	'Biological storage is no longer a speculative metaphor.',
	'https://example.com/articles/neural-ink',
	datetime('now'),
	'["Technology","Biology"]',
	NULL,
	datetime('now')
);

INSERT INTO bookmarks (id, user_id, entry_id, created_at)
VALUES ('bookmark_seed_1', 'user_demo', 'entry_seed_1', datetime('now'));
