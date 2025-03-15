use axum::{
    extract::{Query, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};

use crate::{
    db::{
        self,
        image::{Image, InsertImage},
    },
    server::application::App,
};

use super::util::internal_error;

#[derive(Serialize, Deserialize)]
struct ImageDto {
    id: i32,
    url: String,
    tags: Vec<String>,
}

#[derive(Serialize, Deserialize)]
struct ImportImageDto {
    url: String,
    tags: Vec<String>,
}

#[derive(Deserialize)]
struct GetImageQuery {
    tag: Option<String>,
    page: Option<usize>,
    count: Option<usize>,
}

impl From<&Image> for ImageDto {
    fn from(value: &Image) -> Self {
        ImageDto {
            id: value.id,
            url: value.url.clone(),
            tags: value.tags.clone(),
        }
    }
}
impl From<Image> for ImageDto {
    fn from(value: Image) -> Self {
        ImageDto {
            id: value.id,
            url: value.url.clone(),
            tags: value.tags.clone(),
        }
    }
}

pub fn get_image_api() -> Router<App> {
    Router::new()
        .route("/", get(get_image))
        .route("/import", post(import_image))
}

async fn get_image(
    State(app): State<App>,
    Query(query): Query<GetImageQuery>,
) -> Result<Json<Vec<ImageDto>>, (StatusCode, String)> {
    Ok(Json(
        db::image::get_images(&app.db, query.tag, query.page, query.count)
            .await
            .map(|image| image.iter().map(|b| b.into()).collect())
            .map_err(internal_error)?,
    ))
}

async fn import_image(
    State(app): State<App>,
    Json(images): Json<Vec<ImportImageDto>>,
) -> Result<Json<Vec<ImageDto>>, (StatusCode, String)> {
    let mut dtos = Vec::new();

    for image in images {
        let dto = db::image::create_image(
            &app.db,
            InsertImage {
                url: image.url,
                tags: image.tags,
            },
        )
        .await
        .map_err(internal_error)?;
        dtos.push(dto.into());
    }

    Ok(Json(dtos))
}
