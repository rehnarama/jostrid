use serde::Serialize;
use sqlx::PgPool;

#[derive(sqlx::FromRow, Serialize, Clone)]
pub struct ExpenseCategory {
    pub id: i32,
    pub name: String,
}

pub async fn get_expense_categories(pool: &PgPool) -> Result<Vec<ExpenseCategory>, sqlx::Error> {
    let categories = sqlx::query_as::<_, ExpenseCategory>("SELECT * FROM expense_category;")
        .fetch_all(pool)
        .await?;

    Ok(categories)
}
