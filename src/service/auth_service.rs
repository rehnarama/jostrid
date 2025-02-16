use std::env;

use jwt_authorizer::OneOrArray;
use oauth2::{
    basic::{BasicClient, BasicRequestTokenError, BasicTokenType},
    http::header::{AUTHORIZATION, USER_AGENT},
    reqwest::{async_http_client, AsyncHttpClientError},
    url::Url,
    AuthorizationCode, CsrfToken, EmptyExtraTokenFields, PkceCodeChallenge, PkceCodeVerifier,
    RefreshToken, Scope, StandardTokenResponse,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{Pool, Postgres};

use crate::db::{
    self,
    user::{UpsertUser, User},
};

#[derive(Debug, Clone)]
pub struct AuthService {
    db: Pool<Postgres>,
    client: BasicClient,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct MicrosoftClaims {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scp: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub iss: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aud: Option<OneOrArray<String>>,
    pub preferred_username: String,
}

#[derive(Debug, Deserialize)]
pub struct Credentials {
    pub code: String,
    pub pkce_code_verifier: PkceCodeVerifier,
}

impl Clone for Credentials {
    fn clone(&self) -> Self {
        Self {
            code: self.code.clone(),
            pkce_code_verifier: PkceCodeVerifier::new(self.pkce_code_verifier.secret().clone()),
        }
    }
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

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct OnBehalfOfResponse {
    pub token_type: String,
    pub scope: String,
    pub expires_in: i64,
    pub ext_expires_in: i64,
    pub access_token: String,
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
            .add_scope(Scope::new("offline_access".to_string()))
            .add_scope(Scope::new("api://jostrid-api/Jostrid.Access".to_string()))
            .set_pkce_challenge(pkce_code_challenge)
            .url()
    }

    pub async fn exchange_code(
        &self,
        creds: Credentials,
        scope: String,
    ) -> Result<JostridTokenResponse, AuthError> {
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

    pub async fn exchange_refresh_token(
        &self,
        refresh_token: &RefreshToken,
        scope: String,
    ) -> Result<JostridTokenResponse, AuthError> {
        // Process authorization code, expecting a token response back.
        let token_res = self
            .client
            .exchange_refresh_token(refresh_token)
            .add_scope(Scope::new(scope))
            .request_async(async_http_client)
            .await
            .map_err(AuthError::OAuth2)?;

        Ok(token_res)
    }

    pub async fn acquire_token(
        &self,
        access_token: &str,
        scope: &str,
    ) -> Result<OnBehalfOfResponse, AuthError> {
        let client_secret = env::var("CLIENT_SECRET").unwrap();
        let params = vec![
            ("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer"),
            ("client_id", self.client.client_id()),
            ("client_secret", client_secret.as_str()),
            ("assertion", access_token),
            ("scope", scope),
            ("requested_token_use", "on_behalf_of"),
        ];

        let client = reqwest::Client::new();
        let response = client
            .post(
                self.client
                    .token_url()
                    .expect("Expected token url")
                    .url()
                    .clone(),
            )
            .form(&params)
            .send()
            .await
            .map_err(AuthError::Reqwest)?;

        response
            .json::<OnBehalfOfResponse>()
            .await
            .map_err(AuthError::Reqwest)
    }

    pub async fn authenticate(&self, access_token: &str) -> Result<User, AuthError> {
        let allowed_emails = env::var("ALLOWED_EMAILS").map_err(AuthError::Var)?;
        let mut allowed_emails = allowed_emails.split(",");

        let token = self.acquire_token(access_token, "User.Read").await?;

        // Use access token to request user info.
        let user_info = reqwest::Client::new()
            .get("https://graph.microsoft.com/v1.0/me")
            .header(USER_AGENT.as_str(), "axum-login")
            .header(
                AUTHORIZATION.as_str(),
                format!("Bearer {}", token.access_token),
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

        Ok(user)
    }
}
