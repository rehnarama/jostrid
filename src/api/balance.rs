use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::{Deserialize, Serialize};

use crate::{
    db::{self, balance::Balance},
    server::application::App,
};

use super::util::internal_error;

#[derive(Serialize, Deserialize)]
struct BalanceDto {
    user_id: i32,
    balance: i64,
    currency: String,
}

impl From<&Balance> for BalanceDto {
    fn from(value: &Balance) -> Self {
        BalanceDto {
            user_id: value.user_id,
            balance: value.balance,
            currency: value.currency.clone(),
        }
    }
}

pub fn get_balance_api() -> Router<App> {
    Router::new().route("/", get(get_balance))
}

async fn get_balance(
    State(app): State<App>,
) -> Result<Json<Vec<BalanceDto>>, (StatusCode, String)> {
    Ok(Json(
        db::balance::get_balance(&app.db)
            .await
            .map(|balance| balance.iter().map(|b| b.into()).collect())
            .map_err(internal_error)?,
    ))
}
