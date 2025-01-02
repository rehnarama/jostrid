-- Add up migration script here
CREATE TABLE
    expense_category (id SERIAL PRIMARY KEY, name TEXT NOT NULL);

INSERT INTO
    expense_category (id, name)
VALUES
    (1, 'Cleaning'),
    (2, 'Electricity'),
    (3, 'Heat/gas'),
    (4, 'Other'),
    (5, 'Trash'),
    (6, 'TV/Phone/Internet'),
    (7, 'Water'),
    (8, 'General'),
    (9, 'Games'),
    (10, 'Movies'),
    (11, 'Music'),
    (12, 'Other'),
    (13, 'Sports'),
    (14, 'Dining out'),
    (15, 'Groceries'),
    (16, 'Liquor'),
    (17, 'Other'),
    (18, 'Electronics'),
    (19, 'Furniture'),
    (20, 'Household supplies'),
    (21, 'Maintenance'),
    (22, 'Mortgage'),
    (23, 'Other'),
    (24, 'Pets'),
    (25, 'Rent'),
    (26, 'Services'),
    (27, 'Bicycle'),
    (28, 'Bus/train'),
    (29, 'Car'),
    (30, 'Gas/fuel'),
    (31, 'Hotel'),
    (32, 'Other'),
    (33, 'Parking'),
    (34, 'Plane'),
    (35, 'Taxi'),
    (36, 'Childcare'),
    (37, 'Clothing'),
    (38, 'Education'),
    (39, 'Gifts'),
    (40, 'Insurance'),
    (41, 'Medical expenses'),
    (42, 'Other'),
    (43, 'Taxes');

CREATE TABLE
    expense (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category_id INTEGER REFERENCES expense_category (id),
        paid_by INTEGER NOT NULL REFERENCES users (id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        total INTEGER NOT NULL,
        currency TEXT NOT NULL,
        is_payment BOOLEAN NOT NULL
    );

CREATE TABLE
    account_share (
        user_id INTEGER NOT NULL REFERENCES users (id),
        expense_id INTEGER NOT NULL REFERENCES expense (id) ON DELETE CASCADE,
        share INTEGER NOT NULL,
        PRIMARY KEY (user_id, expense_id)
    );