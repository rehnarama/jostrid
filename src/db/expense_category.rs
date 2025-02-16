use serde::Serialize;
use sqlx::PgPool;

#[derive(sqlx::FromRow, Serialize, Clone)]
pub struct ExpenseCategory {
    pub id: i32,
    pub name: String,
}

pub async fn get_expense_categories(pool: &PgPool) -> Result<Vec<ExpenseCategory>, sqlx::Error> {
    let categories = sqlx::query_as::<_, ExpenseCategory>(
        r#"
    SELECT ec.* FROM expense_category as ec
    LEFT JOIN expense as e
    ON e.category_id = ec.id
    GROUP BY ec.id
    ORDER BY count(e.category_id) DESC;
    "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(categories)
}
