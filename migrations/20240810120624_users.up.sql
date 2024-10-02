-- Add up migration script here
CREATE TABLE -- 'users' plural since user is keyword
    users (id SERIAL PRIMARY KEY, name TEXT NOT NULL);
