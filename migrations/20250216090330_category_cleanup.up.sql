-- Add up migration script here
UPDATE expense
SET
    category_id = 4
WHERE
    category_id in (
        SELECT
            id
        FROM
            expense_category
        WHERE
            name = 'Other'
    );

DELETE FROM expense_category
WHERE
    name = 'Other'
    AND NOT id = 4;