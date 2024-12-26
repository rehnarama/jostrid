use axum::{
    extract::Query,
    http::StatusCode,
    response::{IntoResponse, Redirect},
    routing::get,
    Router,
};
use oauth2::CsrfToken;
use serde::Deserialize;
use tower_sessions::Session;

use crate::service::auth_service::Credentials;

pub const CSRF_STATE_KEY: &str = "oauth.csrf-state";
pub const PKCE_CODE_VERIFIER: &str = "pkce.code-verifier";
pub const ACCESS_TOKEN_KEY: &str = "access_token";

#[derive(Debug, Clone, Deserialize)]
pub struct AuthzResp {
    code: String,
    state: CsrfToken,
}

pub fn router() -> Router<()> {
    Router::new()
        .route("/callback", get(self::get::callback))
        .route("/login", get(self::get::login))
}

mod get {
    use std::{env, sync::Arc};

    use axum::{Extension, Json};
    use oauth2::{PkceCodeChallenge, TokenResponse};
    use tower_cookies::{Cookie, Cookies};
    use tracing::{event, Level};

    use crate::service::auth_service::AuthService;

    use super::*;

    pub async fn login(
        Extension(auth_service): Extension<Arc<AuthService>>,
        session: Session,
    ) -> impl IntoResponse {
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

        Redirect::to(auth_url.as_str()).into_response()
    }

    pub async fn callback(
        Extension(auth_service): Extension<Arc<AuthService>>,
        session: Session,
        Query(AuthzResp {
            code,
            state: new_state,
        }): Query<AuthzResp>,
        cookies: Cookies,
    ) -> impl IntoResponse {
        let Ok(Some(old_state)) = session.get::<CsrfToken>(CSRF_STATE_KEY).await else {
            return StatusCode::BAD_REQUEST.into_response();
        };
        // Ensure the CSRF state has not been tampered with.
        if old_state.secret() != new_state.secret() {
            return StatusCode::BAD_REQUEST.into_response();
        };

        let Ok(Some(pkce_code_verifier)) = session.get(PKCE_CODE_VERIFIER).await else {
            return StatusCode::BAD_REQUEST.into_response();
        };

        let creds = Credentials {
            code,
            pkce_code_verifier,
        };

        let jostrid_token_response = match auth_service
            .acquire_token(creds, "api://jostrid-api/Jostrid.Access".to_string())
            .await
        {
            Ok(token_response) => token_response,
            Err(auth_error) => {
                event!(Level::ERROR, %auth_error, "Failed to acquire token");
                return StatusCode::INTERNAL_SERVER_ERROR.into_response();
            }
        };
        dbg!(jostrid_token_response.access_token().secret().clone());

        let user_info = match auth_service
            .authenticate(&jostrid_token_response.access_token())
            .await
        {
            Ok(user) => user,
            Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
        };

        // TODO: Add access_token as cookie
        cookies.add(Cookie::new(
            ACCESS_TOKEN_KEY,
            jostrid_token_response.access_token().secret().clone(),
        ));

        let Ok(frontend_url) = env::var("FRONTEND_URL") else {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Couldn't get frontend url",
            )
                .into_response();
        };

        // Redirect::to(&frontend_url).into_response()
        Json(jostrid_token_response).into_response()
    }
}
