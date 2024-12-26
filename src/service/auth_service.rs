use std::env;

use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use oauth2::{
    basic::{BasicClient, BasicRequestTokenError, BasicTokenType},
    http::header::{AUTHORIZATION, USER_AGENT},
    reqwest::{async_http_client, AsyncHttpClientError},
    url::Url,
    AccessToken, AuthorizationCode, CsrfToken, EmptyExtraTokenFields, PkceCodeChallenge,
    PkceCodeVerifier, Scope, StandardTokenResponse, TokenResponse, TokenType,
};
use serde::Deserialize;
use serde_json::Value;
use sqlx::{Pool, Postgres};
use tower::{Layer, Service};

use crate::{
    api::user,
    db::{
        self,
        user::{UpsertUser, User},
    },
};

#[derive(Debug, Clone)]
pub struct AuthService {
    db: Pool<Postgres>,
    client: BasicClient,
}

#[derive(Debug, Deserialize)]
pub struct Credentials {
    pub code: String,
    pub pkce_code_verifier: PkceCodeVerifier,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub user_principal_name: String,
    pub id: String,
    pub display_name: String,
    pub surname: String,
    pub given_name: String,
    pub preferred_language: String,
    pub mail: String,
    pub mobile_phone: Value,
    pub job_title: Value,
    pub office_location: Value,
    pub business_phones: Vec<Value>,
}

#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error(transparent)]
    Var(env::VarError),

    #[error(transparent)]
    Sqlx(sqlx::Error),

    #[error(transparent)]
    Reqwest(reqwest::Error),

    #[error(transparent)]
    OAuth2(BasicRequestTokenError<AsyncHttpClientError>),

    #[error("The given email '{0}' is not allowed to sign in")]
    ForbiddenEmail(String),
}

pub type JostridTokenResponse = StandardTokenResponse<EmptyExtraTokenFields, BasicTokenType>;

impl AuthService {
    pub fn new(db: Pool<Postgres>, client: BasicClient) -> Self {
        Self { db, client }
    }

    pub fn authorize_url(&self, pkce_code_challenge: PkceCodeChallenge) -> (Url, CsrfToken) {
        self.client
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new("User.Read".to_string()))
            .add_scope(Scope::new(
                "api://5e7b7aaf-2267-4f88-bc37-29b4d1ff4d0e/access_as_user".to_string(),
            ))
            .set_pkce_challenge(pkce_code_challenge)
            .url()
    }

    pub async fn acquire_token(
        &self,
        creds: Credentials,
        scope: String,
    ) -> Result<JostridTokenResponse, AuthError> {
        dbg!(&creds);
        // Process authorization code, expecting a token response back.
        let token_res = self
            .client
            .exchange_code(AuthorizationCode::new(creds.code))
            .set_pkce_verifier(creds.pkce_code_verifier)
            .add_extra_param("scope", scope)
            .request_async(async_http_client)
            .await
            .map_err(AuthError::OAuth2)?;

        Ok(token_res)
    }

    pub async fn authenticate(&self, access_token: &AccessToken) -> Result<User, AuthError> {
        let allowed_emails = env::var("ALLOWED_EMAILS").map_err(AuthError::Var)?;
        let mut allowed_emails = allowed_emails.split(",");

        // Use access token to request user info.
        let user_info = reqwest::Client::new()
            .get("https://graph.microsoft.com/v1.0/me")
            .header(USER_AGENT.as_str(), "axum-login")
            .header(
                AUTHORIZATION.as_str(),
                format!("Bearer {}", access_token.secret()),
            )
            .send()
            .await
            .map_err(AuthError::Reqwest)?
            .json::<UserInfo>()
            .await
            .map_err(AuthError::Reqwest)?;

        let is_allowed = allowed_emails.any(|email| email == user_info.mail);

        if !is_allowed {
            return Err(AuthError::ForbiddenEmail(user_info.mail));
        }

        let user = db::user::upsert_user(
            &self.db,
            UpsertUser {
                microsoft_id: user_info.id,
                name: user_info.display_name,
                email: user_info.mail,
            },
        )
        .await
        .map_err(AuthError::Sqlx)?;

        // // Persist user in our database so we can use `get_user`.
        // let user = sqlx::query_as(
        //     r#"
        //     insert into users (username, access_token)
        //     values (?, ?)
        //     on conflict(username) do update
        //     set access_token = excluded.access_token
        //     returning *
        //     "#,
        // )
        // .bind(user_info.login)
        // .bind(token_res.access_token().secret())
        // .fetch_one(&self.db)
        // .await
        // .map_err(Self::Error::Sqlx)?;

        Ok(user)
    }
}
