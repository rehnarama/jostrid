use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::{Deserialize, Serialize};

use crate::{
    api::util::internal_error,
    db::{self, user::User},
    server::application::App,
};

#[derive(Deserialize, Serialize)]
pub struct UserDto {
    id: i32,
    name: String,
    email: String,
    phone_number: Option<String>,
}

impl From<&User> for UserDto {
    fn from(value: &User) -> Self {
        UserDto {
            id: value.id,
            name: value.name.clone(),
            email: value.email.clone(),
            phone_number: value.phone_number.clone(),
        }
    }
}

pub fn get_user_api() -> Router<App> {
    Router::new().route("/", get(get_users))
}

async fn get_users(State(app): State<App>) -> Result<Json<Vec<UserDto>>, (StatusCode, String)> {
    let users = db::user::get_users(&app.db).await.map_err(internal_error)?;

    let dtos = users.iter().map(|user| user.into()).collect();

    Ok(Json(dtos))
}
