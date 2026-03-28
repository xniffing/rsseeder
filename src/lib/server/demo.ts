import type { ArchiveDigest, ArchiveEntry, ArchiveFeed, Recommendation } from '$lib/types';

export const demoFeeds: ArchiveFeed[] = [
	{
		id: 'feed_demo_atlantic',
		title: 'The Atlantic',
		description: 'Ideas, politics, culture, and essays for deliberate reading.',
		feedUrl: 'https://example.com/atlantic/feed.xml',
		siteUrl: 'https://example.com/atlantic',
		imageUrl: null,
		category: 'Essentials',
		lastSyncedAt: '2026-03-23T07:00:00.000Z',
		totalEntries: 24,
		unreadCount: 12
	},
	{
		id: 'feed_demo_verge',
		title: 'The Verge',
		description: 'Technology, platforms, and the mechanics of digital life.',
		feedUrl: 'https://example.com/verge/feed.xml',
		siteUrl: 'https://example.com/verge',
		imageUrl: null,
		category: 'Tech & Logic',
		lastSyncedAt: '2026-03-23T06:00:00.000Z',
		totalEntries: 18,
		unreadCount: 5
	},
	{
		id: 'feed_demo_aeon',
		title: 'Aeon',
		description: 'Long-form philosophy, psychology, and science essays.',
		feedUrl: 'https://example.com/aeon/feed.xml',
		siteUrl: 'https://example.com/aeon',
		imageUrl: null,
		category: 'Journals',
		lastSyncedAt: '2026-03-22T19:00:00.000Z',
		totalEntries: 9,
		unreadCount: 3
	}
];

export const demoEntries: ArchiveEntry[] = [
	{
		id: 'entry_demo_1',
		feedId: 'feed_demo_atlantic',
		feedTitle: 'The Atlantic',
		title: 'The Architecture of Silence: Designing for Focus in the Age of Noise',
		summary:
			'In an era defined by constant intrusion, designers are returning to quiet, structural interfaces that protect concentration.',
		contentText:
			'In the quietest corners of our digital existence, there remains a profound craving for the tactile.\n\nWe seek the weight of words that do not flicker on a refresh cycle.\n\nThe architecture of silence is not merely the absence of noise, but the presence of intentionality.',
		contentMarkdown:
			'In the quietest corners of our digital existence, there remains a profound craving for the tactile.\n\nWe seek the weight of words that do not flicker on a refresh cycle.\n\nThe architecture of silence is not merely the absence of noise, but the presence of intentionality.',
		url: 'https://example.com/articles/architecture-of-silence',
		publishedAt: '2026-03-23T07:14:00.000Z',
		readingMinutes: 9,
		tags: ['Architecture', 'Culture'],
		bookmarked: true,
		status: 'unread'
	},
	{
		id: 'entry_demo_2',
		feedId: 'feed_demo_verge',
		feedTitle: 'The Verge',
		title: 'Neural Ink: The Subtle Art of Biological Data Storage',
		summary:
			'Synthetic biologists are treating living systems as archives, compressing human records into organic substrates.',
		contentText:
			'Biological storage is no longer a speculative metaphor.\n\nResearchers now frame DNA as archival infrastructure rather than biological residue.',
		contentMarkdown:
			'Biological storage is no longer a speculative metaphor.\n\nResearchers now frame DNA as archival infrastructure rather than biological residue.',
		url: 'https://example.com/articles/neural-ink',
		publishedAt: '2026-03-23T05:40:00.000Z',
		readingMinutes: 7,
		tags: ['Technology', 'Biology'],
		bookmarked: false,
		status: 'read'
	},
	{
		id: 'entry_demo_3',
		feedId: 'feed_demo_aeon',
		feedTitle: 'Aeon',
		title: 'The Philosophy of the Void: Embracing Nothingness in Design',
		summary: 'How negative space, restraint, and absence shape better digital reading environments.',
		contentText:
			'To read is to inhabit a room built by another.\n\nWhen the interface disappears, only the room remains.',
		contentMarkdown:
			'To read is to inhabit a room built by another.\n\nWhen the interface disappears, only the room remains.',
		url: 'https://example.com/articles/void-design',
		publishedAt: '2026-03-22T18:00:00.000Z',
		readingMinutes: 6,
		tags: ['Design', 'Philosophy'],
		bookmarked: false,
		status: 'unread'
	}
];

export const demoHomepageDigest: ArchiveDigest = {
	userId: 'demo_user',
	generatedAt: '2026-03-23T08:00:00.000Z',
	inputWindow: {
		perSourceLimit: 10
	},
	sourceCount: 3,
	entryCount: 3,
	overview:
		'Across the current archive, technology systems, intellectual culture, and interface design are converging around one recurring concern: how to preserve depth and human attention inside increasingly noisy environments.',
	signals: ['Attention as infrastructure', 'Technology framed through culture', 'Design treated as editorial medium'],
	groups: [
		{
			category: 'Technology',
			type: 'Analysis',
			headline: 'Systems are being reimagined as archives rather than streams',
			summary:
				'Coverage this cycle treats storage, computation, and interface design as long-horizon systems for preserving meaning, not just accelerating consumption.',
			articleCount: 2,
			sourceCount: 2,
			articles: [
				{
					entryId: 'entry_demo_2',
					title: 'Neural Ink: The Subtle Art of Biological Data Storage',
					feedTitle: 'The Verge',
					publishedAt: '2026-03-23T05:40:00.000Z',
					url: 'https://example.com/articles/neural-ink',
					whyIncluded: 'Shows archive thinking moving into biological computing.'
				},
				{
					entryId: 'entry_demo_1',
					title: 'The Architecture of Silence: Designing for Focus in the Age of Noise',
					feedTitle: 'The Atlantic',
					publishedAt: '2026-03-23T07:14:00.000Z',
					url: 'https://example.com/articles/architecture-of-silence',
					whyIncluded: 'Connects product design to concentration and information discipline.'
				}
			]
		},
		{
			category: 'Ideas',
			type: 'Essay',
			headline: 'Writers are defending absence, restraint, and negative space',
			summary:
				'The most reflective writing in the archive argues that subtraction can be as meaningful as addition, especially in products built for reading and thought.',
			articleCount: 1,
			sourceCount: 1,
			articles: [
				{
					entryId: 'entry_demo_3',
					title: 'The Philosophy of the Void: Embracing Nothingness in Design',
					feedTitle: 'Aeon',
					publishedAt: '2026-03-22T18:00:00.000Z',
					url: 'https://example.com/articles/void-design',
					whyIncluded: 'Provides the philosophical frame behind the archive aesthetic.'
				}
			]
		}
	]
};

export const demoRecommendations: Recommendation[] = [
	{
		title: 'The Dispatch Quarterly',
		category: 'Independent Journalism',
		description: 'Deep dives into the mechanics of modern geopolitics and trade.',
		subscribers: '12,402',
		suggestionUrl: 'https://dispatch.example/rss'
	},
	{
		title: 'Form & Void',
		category: 'Aesthetics & Form',
		description: 'Architecture, interfaces, and the severe beauty of structural design.',
		subscribers: '8,950',
		suggestionUrl: 'https://formvoid.example/rss'
	},
	{
		title: 'Silicon Ethics',
		category: 'Critical Tech',
		description: 'Questioning the social impact of algorithmic systems and platform power.',
		subscribers: '42,100',
		suggestionUrl: 'https://siliconethics.example/rss'
	}
];
