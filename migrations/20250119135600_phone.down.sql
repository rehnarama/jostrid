-- Add down migration script here
ALTER TABLE users
DROP COLUMN phone_number;
