use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Serialize;
use sqlx::PgPool;

use crate::{api::util::internal_error, db};

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

pub fn get_expense_category_api(pool: PgPool) -> Router {
    Router::new()
        .route("/", get(get_expense_categories))
        .with_state(pool)
}

async fn get_expense_categories(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<ExpenseCategoryDto>>, (StatusCode, String)> {
    let categories = db::expense_category::get_expense_categories(&pool)
        .await
        .map_err(internal_error)?;

    let dto = categories.iter().map(|category| category.into()).collect();

    Ok(Json(dto))
}
