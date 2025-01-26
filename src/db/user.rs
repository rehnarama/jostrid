use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub phone_number: Option<String>,
}

#[derive(Debug)]
pub struct UpsertUser {
    pub microsoft_id: String,
    pub name: String,
    pub email: String,
}

#[derive(Debug)]
pub struct PatchUser {
    pub id: i32,
    pub email: Option<String>,
    pub phone_number: Option<String>,
}

pub async fn get_users(pool: &PgPool) -> Result<Vec<User>, sqlx::Error> {
    let users = sqlx::query_as::<_, User>("SELECT * FROM users;")
        .fetch_all(pool)
        .await?;

    Ok(users)
}

pub async fn get_user_by_email(pool: &PgPool, email: &str) -> Result<User, sqlx::Error> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1;")
        .bind(email)
        .fetch_one(pool)
        .await?;

    Ok(user)
}

pub async fn upsert_user(pool: &PgPool, user: UpsertUser) -> Result<User, sqlx::Error> {
    let user = sqlx::query_as::<_, User>(
        "
        INSERT INTO users (microsoft_id, name, email) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (microsoft_id) DO UPDATE
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

pub async fn patch_user(pool: &PgPool, user: PatchUser) -> Result<User, sqlx::Error> {
    let user = sqlx::query_as::<_, User>(
        "
        UPDATE users
        SET
            email = COALESCE($1, email),
            phone_number = COALESCE($2, phone_number)
        WHERE id = $3
        RETURNING *;
    ",
    )
    .bind(user.email)
    .bind(user.phone_number)
    .bind(user.id)
    .fetch_one(pool)
    .await?;

    Ok(user)
}
