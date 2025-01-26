-- Add up migration script here
ALTER TABLE users
ADD COLUMN phone_number TEXT;
