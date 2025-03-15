-- Add up migration script here
CREATE TABLE -- 'users' plural since user is keyword
    image (
    id SERIAL PRIMARY KEY, 
    url TEXT NOT NULL, 
    tags TEXT[] NOT NULL DEFAULT '{}'
);
