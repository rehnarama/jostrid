use axum::{extract::State, routing::get, Json, Router};
use hyper::StatusCode;
use jwt_authorizer::JwtClaims;
use serde::{Deserialize, Serialize};

use crate::{db, server::application::App, service::auth_service::MicrosoftClaims};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct MeDto {
    id: i32,
    name: String,
    email: String,
}

pub fn get_me_api() -> Router<App> {
    Router::new().route("/", get(get_me))
}

async fn get_me(
    State(app): State<App>,
    JwtClaims(user): JwtClaims<MicrosoftClaims>,
) -> Result<Json<MeDto>, (StatusCode, String)> {
    let Ok(me) = db::user::get_user_by_email(&app.db, &user.preferred_username).await else {
        return Err((StatusCode::NOT_FOUND, "Couldn't find user with the given JWT".to_string()));
    };
    
    Ok(Json(MeDto {
        email: me.email,
        id: me.id,
        name: me.name
    }))
}
