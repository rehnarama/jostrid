use axum::{routing::get, Router};
use jwt_authorizer::{layer::JwtSource, Authorizer, IntoLayer, JwtAuthorizer, Validation};
use oauth2::{basic::BasicClient, AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};
use sqlx::{
    migrate,
    postgres::{PgPoolOptions, Postgres},
    Pool,
};
use std::env;
use time::Duration;
use tower_cookies::CookieManagerLayer;
use tower_sessions::{cookie::SameSite, Expiry, MemoryStore, SessionManagerLayer};

use crate::{
    api::{
        balance::get_balance_api,
        expense::get_expense_api,
        expense_category::get_expense_category_api,
        me::get_me_api,
        auth::{self, ACCESS_TOKEN_KEY},
        user::get_user_api,
    },
    service::auth_service::MicrosoftClaims,
};

#[derive(Clone)]
pub struct App {
    pub db: Pool<Postgres>,
    pub oauth_client: BasicClient,
}

impl App {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let db_url = std::env::var("DATABASE_URL").unwrap();

        // set up connection pool
        let db = PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(std::time::Duration::from_secs(3))
            .connect_with(db_url.parse().unwrap())
            .await
            .expect("can't connect to database");

        migrate!().run(&db).await.unwrap();

        let client_id = env::var("CLIENT_ID")
            .map(ClientId::new)
            .expect("CLIENT_ID should be provided.");
        let client_secret = env::var("CLIENT_SECRET")
            .map(ClientSecret::new)
            .expect("CLIENT_SECRET should be provided");

        let auth_url = AuthUrl::new(
            "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize".to_string(),
        )?;
        let token_url = TokenUrl::new(
            "https://login.microsoftonline.com/consumers/oauth2/v2.0/token".to_string(),
        )?;
        let oauth_client =
            BasicClient::new(client_id, Some(client_secret), auth_url, Some(token_url))
                .set_redirect_uri(
                    RedirectUrl::new("http://localhost:5173/oauth/callback".to_string()).unwrap(),
                );

        Ok(App { db, oauth_client })
    }

    pub async fn serve(self) -> Result<(), Box<dyn std::error::Error>> {
        let session_store = MemoryStore::default();
        let session_layer = SessionManagerLayer::new(session_store)
            .with_secure(false)
            .with_same_site(SameSite::Lax) // Ensure we send the cookie from the OAuth redirect.
            .with_expiry(Expiry::OnInactivity(Duration::days(1)));

        let jwt_validation = Validation::new().aud(&["5e7b7aaf-2267-4f88-bc37-29b4d1ff4d0e"]);

        let jwt_auth: Authorizer<MicrosoftClaims> = JwtAuthorizer::from_oidc(
            "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
        )
        .validation(jwt_validation)
        .check(|claims: &MicrosoftClaims| {
            claims
                .scp
                .as_ref()
                .is_some_and(|scp| scp == "Jostrid.Access")
        })
        .jwt_source(JwtSource::Cookie(ACCESS_TOKEN_KEY.to_string()))
        .build()
        .await
        .expect("Couldn't load oidc url");

        // build our application with a route
        let app = Router::new()
            .route("/api", get(hello_world))
            .nest("/api/balance", get_balance_api())
            .nest("/api/expense", get_expense_api())
            .nest("/api/expense_category", get_expense_category_api())
            .nest("/api/user", get_user_api())
            .nest("/api/me", get_me_api())
            .layer(jwt_auth.into_layer())
            .nest("/", auth::router())
            .with_state(self)
            .layer(session_layer)
            .layer(CookieManagerLayer::new());

        // run our app with hyper, listening globally on port 3000
        let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
        axum::serve(listener, app).await.unwrap();

        Ok(())
    }
}

async fn hello_world() -> &'static str {
    "Hello, World!"
}
