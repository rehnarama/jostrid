use axum::{
    extract::Query,
    http::StatusCode,
    response::{IntoResponse, Redirect},
    routing::{get, post},
    Json, Router,
};
use log::warn;
use oauth2::CsrfToken;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tower_sessions::Session;

use axum::extract::State;
use oauth2::{PkceCodeChallenge, TokenResponse};
use time::OffsetDateTime;
use tower_cookies::{Cookie, Cookies};
use tracing::{event, Level};

use crate::{
    db::user::User,
    service::auth_service::{AuthService, JostridTokenResponse},
};

use crate::{server::application::App, service::auth_service::Credentials};

pub const CSRF_STATE_KEY: &str = "oauth.csrf-state";
pub const PKCE_CODE_VERIFIER: &str = "pkce.code-verifier";
pub const ACCESS_TOKEN_KEY: &str = "access_token";

#[derive(Debug, Clone, Deserialize)]
pub struct AuthzResp {
    code: String,
    state: CsrfToken,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct LoginResponseDto {
    user: User,
    #[serde(flatten)]
    token: JostridTokenResponse,
}

pub fn router() -> Router<App> {
    Router::new()
        .route("/callback", get(callback))
        .route("/redirect", get(redirect))
        .route("/logout", post(logout))
}

async fn redirect(State(app_state): State<App>, session: Session) -> String {
    let auth_service = AuthService::new(app_state.db, app_state.oauth_client);

    let (pkce_code_challenge, pkce_code_verifier) = PkceCodeChallenge::new_random_sha256();
    let (auth_url, csrf_state) = auth_service.authorize_url(pkce_code_challenge);

    session
        .insert(CSRF_STATE_KEY, csrf_state.secret())
        .await
        .expect("Serialization should not fail.");
    session
        .insert(PKCE_CODE_VERIFIER, pkce_code_verifier)
        .await
        .expect("Serialization should not fail.");

    auth_url.to_string()
}

async fn logout(cookies: Cookies) -> impl IntoResponse {
    let mut cookie = Cookie::from(ACCESS_TOKEN_KEY);
    cookie.set_path("/");
    cookies.remove(cookie);

    (StatusCode::OK).into_response()
}

async fn callback(
    State(app_state): State<App>,
    session: Session,
    Query(AuthzResp {
        code,
        state: new_state,
    }): Query<AuthzResp>,
    cookies: Cookies,
) -> impl IntoResponse {
    let Ok(Some(old_state)) = session.get::<CsrfToken>(CSRF_STATE_KEY).await else {
        warn!("No CSRF token in session");
        return StatusCode::BAD_REQUEST.into_response();
    };
    // Ensure the CSRF state has not been tampered with.
    if old_state.secret() != new_state.secret() {
        warn!(
            "Bad old_state, got {} expected {}",
            old_state.secret(),
            new_state.secret()
        );
        return StatusCode::BAD_REQUEST.into_response();
    };

    let Ok(Some(pkce_code_verifier)) = session.get(PKCE_CODE_VERIFIER).await else {
        return StatusCode::BAD_REQUEST.into_response();
    };

    let creds = Credentials {
        code,
        pkce_code_verifier,
    };

    let auth_service = AuthService::new(app_state.db, app_state.oauth_client);

    let token_response = match auth_service
        .exchange_code(
            creds.clone(),
            "api://jostrid-api/Jostrid.Access".to_string(),
        )
        .await
    {
        Ok(token_response) => token_response,
        Err(auth_error) => {
            dbg!(&auth_error);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to acquire token: {}", auth_error),
            )
                .into_response();
        }
    };

    let user = match auth_service
        .authenticate(token_response.access_token().secret())
        .await
    {
        Ok(user) => user,
        Err(auth_error) => {
            event!(Level::ERROR, %auth_error, "Failed to get user info");
            return (
                StatusCode::FORBIDDEN,
                format!("Failed to get user info: {}", auth_error),
            )
                .into_response();
        }
    };

    Json(LoginResponseDto {
        user,
        token: token_response,
    })
    .into_response()
}
