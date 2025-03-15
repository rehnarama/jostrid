use sqlx::{prelude::FromRow, PgPool};

#[derive(FromRow)]
pub struct Image {
    pub id: i32,
    pub url: String,
    pub tags: Vec<String>,
}

pub struct InsertImage {
    pub url: String,
    pub tags: Vec<String>,
}

pub async fn get_images(
    pool: &PgPool,
    tag: Option<String>,
    page: Option<usize>,
    count: Option<usize>,
) -> Result<Vec<Image>, sqlx::Error> {
    sqlx::query_as(
        r#"
SELECT id, url, tags
FROM image
WHERE $1 = ANY(tags);
    "#,
    )
    .bind(tag)
    .fetch_all(pool)
    .await
}

pub async fn create_image(pool: &PgPool, image: InsertImage) -> Result<Image, sqlx::Error> {
    sqlx::query_as(
        r#"
    INSERT INTO image
    (url, tags)
    VALUES ($1, $2)
    RETURNING id, url, tags;
        "#,
    )
    .bind(image.url)
    .bind(image.tags)
    .fetch_one(pool)
    .await
}
