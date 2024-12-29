use sqlx::{prelude::FromRow, PgPool};

static GET_BALANCE: &str = r#"
SELECT user_id, SUM(share) as balance, e.currency
FROM account_share
LEFT JOIN expense as e ON e.id = expense_id
GROUP BY user_id, e.currency;
"#;

#[derive(FromRow)]
pub struct Balance {
    pub balance: i64,
    pub user_id: i32,
    pub currency: String,
}

pub async fn get_balance(pool: &PgPool) -> Result<Vec<Balance>, sqlx::Error> {
    sqlx::query_as(GET_BALANCE).fetch_all(pool).await
}
