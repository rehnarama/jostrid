-- Add down migration script here
ALTER TABLE users
DROP COLUMN email;

ALTER TABLE users
DROP COLUMN microsoft_id;