use std::time::Duration;

use api::{
    balance::get_balance_api, expense::get_expense_api, expense_category::get_expense_category_api,
    user::get_user_api,
};
use axum::{
    http::{HeaderValue, Method},
    routing::get,
    Router,
};
use diesel_migrations::{embed_migrations, EmbeddedMigrations};
use dotenvy::dotenv;
use sqlx::{migrate, postgres::PgPoolOptions};
use tower_http::cors::{AllowOrigin, CorsLayer};
mod api;
mod db;

// this embeds the migrations into the application binary
// the migration path is relative to the `CARGO_MANIFEST_DIR`
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations/");

#[tokio::main]
async fn main() {
    dotenv().ok();

    // initialize tracing
    tracing_subscriber::fmt::init();

    let db_url = std::env::var("DATABASE_URL").unwrap();

    // set up connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(&db_url)
        .await
        .expect("can't connect to database");

    migrate!().run(&pool).await.unwrap();

    // run the migrations on server startup
    {
        // let conn = pool.get().await.unwrap();
        // conn.interact(|conn| conn.run_pending_migrations(MIGRATIONS).map(|_| ()))
        //     .await
        //     .unwrap()
        //     .unwrap();
    }

    let cors = CorsLayer::new()
        // allow `GET` and `POST` when accessing the resource
        .allow_methods([Method::GET, Method::POST])
        // allow requests from any origin
        .allow_origin(AllowOrigin::exact(HeaderValue::from_static(
            "http://localhost:5173",
        )));

    // build our application with a route
    let app = Router::new()
        .route("/api", get(root))
        .nest("/api/balance", get_balance_api(pool.clone()))
        .nest("/api/expense", get_expense_api(pool.clone()))
        .nest(
            "/api/expense_category",
            get_expense_category_api(pool.clone()),
        )
        .nest("/api/user", get_user_api(pool.clone()))
        .layer(cors);

    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// basic handler that responds with a static string
async fn root() -> &'static str {
    "Hello, World!"
}

// async fn create_user(
//     // this argument tells axum to parse the request body
//     // as JSON into a `CreateUser` type
//     Json(payload): Json<CreateUser>,
// ) -> (StatusCode, Json<User>) {
//     // insert your application logic here
//     let user = User {
//         id: 1337,
//         username: payload.username,
//     };

//     // this will be converted into a JSON response
//     // with a status code of `201 Created`
//     (StatusCode::CREATED, Json(user))
// }

// // the input to our `create_user` handler
// #[derive(Deserialize)]
// struct CreateUser {
//     username: String,
// }

// // the output to our `create_user` handler
// #[derive(Serialize)]
// struct User {
//     id: u64,
//     username: String,
// }
