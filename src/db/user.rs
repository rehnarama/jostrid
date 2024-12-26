use serde::Serialize;
use sqlx::PgPool;

#[derive(Debug, sqlx::FromRow, Serialize, Clone)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
}

#[derive(Debug)]
pub struct UpsertUser {
    pub microsoft_id: String,
    pub name: String,
    pub email: String,
}

pub async fn get_users(pool: &PgPool) -> Result<Vec<User>, sqlx::Error> {
    let users = sqlx::query_as::<_, User>("SELECT * FROM users;")
        .fetch_all(pool)
        .await?;

    Ok(users)
}

pub async fn upsert_user(pool: &PgPool, user: UpsertUser) -> Result<User, sqlx::Error> {
    let user = sqlx::query_as::<_, User>(
        "
        INSERT INTO users (microsoft_id, name, email) 
        VALUES ($1, $2, $3) 
        ON CONFLICT DO UPDATE
        SET name = EXCLUDED.name, email = EXCLUDED.email
        RETURNING *;
        ",
    )
    .bind(user.microsoft_id)
    .bind(user.name)
    .bind(user.email)
    .fetch_one(pool)
    .await?;

    Ok(user)
}
