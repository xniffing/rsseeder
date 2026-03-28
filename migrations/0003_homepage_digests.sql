CREATE TABLE homepage_digests (
	user_id TEXT PRIMARY KEY REFERENCES users(id),
	digest_json TEXT,
	generated_at TEXT,
	input_signature TEXT,
	status TEXT NOT NULL DEFAULT 'pending',
	last_error TEXT
);
