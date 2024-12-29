-- Add up migration script here
ALTER TABLE users
ADD COLUMN email TEXT NOT NULL DEFAULT 'unset@email.com' UNIQUE;

ALTER TABLE users
ADD COLUMN microsoft_id TEXT UNIQUE;