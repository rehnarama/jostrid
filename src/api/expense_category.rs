use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Serialize;

use crate::{api::util::internal_error, db, server::application::App};

#[derive(Serialize)]
pub struct ExpenseCategoryDto {
    id: i32,
    name: String,
}

impl From<&db::expense_category::ExpenseCategory> for ExpenseCategoryDto {
    fn from(value: &db::expense_category::ExpenseCategory) -> Self {
        ExpenseCategoryDto {
            id: value.id,
            name: value.name.clone(),
        }
    }
}
impl From<db::expense_category::ExpenseCategory> for ExpenseCategoryDto {
    fn from(value: db::expense_category::ExpenseCategory) -> Self {
        (&value).into()
    }
}

pub fn get_expense_category_api() -> Router<App> {
    Router::new().route("/", get(get_expense_categories))
}

async fn get_expense_categories(
    State(app): State<App>,
) -> Result<Json<Vec<ExpenseCategoryDto>>, (StatusCode, String)> {
    let categories = db::expense_category::get_expense_categories(&app.db)
        .await
        .map_err(internal_error)?;

    let dto = categories.iter().map(|category| category.into()).collect();

    Ok(Json(dto))
}
