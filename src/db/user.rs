use serde::Serialize;
use sqlx::PgPool;

#[derive(sqlx::FromRow, Serialize, Clone)]
pub struct User {
    pub id: i32,
    pub name: String,
}

pub async fn get_users(pool: &PgPool) -> Result<Vec<User>, sqlx::Error> {
    let users = sqlx::query_as::<_, User>("SELECT * FROM users;")
        .fetch_all(pool)
        .await?;

    Ok(users)
}
