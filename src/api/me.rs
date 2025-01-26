use axum::{extract::State, routing::get, Json, Router};
use hyper::StatusCode;
use jwt_authorizer::JwtClaims;
use serde::{Deserialize, Serialize};

use crate::{
    db::{self, user::PatchUser},
    server::application::App,
    service::auth_service::MicrosoftClaims,
};

use super::util::internal_error;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct MeDto {
    id: i32,
    name: String,
    email: String,
    phone_number: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct PatchMeDto {
    phone_number: Option<String>,
}

pub fn get_me_api() -> Router<App> {
    Router::new().route("/", get(get_me).patch(patch_me))
}

async fn get_me(
    State(app): State<App>,
    JwtClaims(user): JwtClaims<MicrosoftClaims>,
) -> Result<Json<MeDto>, (StatusCode, String)> {
    let me = db::user::get_user_by_email(&app.db, &user.preferred_username)
        .await
        .map_err(internal_error)?;

    Ok(Json(MeDto {
        email: me.email,
        id: me.id,
        name: me.name,
        phone_number: me.phone_number,
    }))
}

async fn patch_me(
    State(app): State<App>,
    JwtClaims(user): JwtClaims<MicrosoftClaims>,
    Json(patch_dto): Json<PatchMeDto>,
) -> Result<Json<MeDto>, (StatusCode, String)> {
    let me = db::user::get_user_by_email(&app.db, &user.preferred_username)
        .await
        .map_err(internal_error)?;

    let me = db::user::patch_user(
        &app.db,
        PatchUser {
            id: me.id,
            email: None,
            phone_number: patch_dto.phone_number,
        },
    )
    .await
    .map_err(internal_error)?;

    Ok(Json(MeDto {
        email: me.email,
        id: me.id,
        name: me.name,
        phone_number: me.phone_number,
    }))
}
