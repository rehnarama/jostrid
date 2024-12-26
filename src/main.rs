use dotenvy::dotenv;
use server::application::App;

mod api;
mod db;
mod server;
mod service;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    // initialize tracing
    tracing_subscriber::fmt::init();

    App::new().await?.serve().await
}
