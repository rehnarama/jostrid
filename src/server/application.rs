use axum::{extract::Extension, http::Method, routing::get, Router};
use oauth2::{basic::BasicClient, AuthUrl, ClientId, ClientSecret, TokenUrl};
use sqlx::{
    migrate,
    postgres::{PgPoolOptions, Postgres},
    Pool,
};
use std::{env, sync::Arc};
use time::Duration;
use tower_cookies::CookieManagerLayer;
use tower_http::cors::{AllowOrigin, Any, CorsLayer};
use tower_sessions::{cookie::SameSite, Expiry, MemoryStore, SessionManagerLayer};

use crate::{
    api::{
        balance::get_balance_api, expense::get_expense_api,
        expense_category::get_expense_category_api, oauth, user::get_user_api,
    },
    service::auth_service::AuthService,
};

pub struct App {
    db: Pool<Postgres>,
    oauth_client: BasicClient,
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
            BasicClient::new(client_id, Some(client_secret), auth_url, Some(token_url));

        Ok(App { db, oauth_client })
    }

    pub async fn serve(self) -> Result<(), Box<dyn std::error::Error>> {
        let session_store = MemoryStore::default();
        let session_layer = SessionManagerLayer::new(session_store)
            .with_secure(false)
            .with_same_site(SameSite::Lax) // Ensure we send the cookie from the OAuth redirect.
            .with_expiry(Expiry::OnInactivity(Duration::days(1)));

        let auth_service = Arc::new(AuthService::new(self.db.clone(), self.oauth_client));

        let cors = CorsLayer::new()
            // allow `GET` and `POST` when accessing the resource
            .allow_methods([Method::GET, Method::POST])
            .allow_headers(Any)
            // allow requests from any origin
            .allow_origin(AllowOrigin::exact(
                env::var("FRONTEND_URL")
                    .unwrap_or("http://localhost:5173".to_string())
                    .parse()?,
            ));

        // build our application with a route
        let app = Router::new()
            .route("/api", get(hello_world))
            .nest("/api/balance", get_balance_api(self.db.clone()))
            .nest("/api/expense", get_expense_api(self.db.clone()))
            .nest(
                "/api/expense_category",
                get_expense_category_api(self.db.clone()),
            )
            .nest("/api/user", get_user_api(self.db.clone()))
            .nest("/oauth", oauth::router())
            .layer(cors)
            .layer(session_layer)
            .layer(Extension(auth_service))
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
