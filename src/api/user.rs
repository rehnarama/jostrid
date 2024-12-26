use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::{
    api::util::internal_error,
    db::{self, user::User},
};

#[derive(Deserialize, Serialize)]
pub struct UserDto {
    id: i32,
    name: String,
    email: String,
}

impl From<&User> for UserDto {
    fn from(value: &User) -> Self {
        UserDto {
            id: value.id,
            name: value.name.clone(),
            email: value.email.clone(),
        }
    }
}

pub fn get_user_api(pool: PgPool) -> Router {
    Router::new().route("/", get(get_users)).with_state(pool)
}

async fn get_users(State(pool): State<PgPool>) -> Result<Json<Vec<UserDto>>, (StatusCode, String)> {
    let users = db::user::get_users(&pool).await.map_err(internal_error)?;

    let dtos = users.iter().map(|user| user.into()).collect();

    Ok(Json(dtos))
}
