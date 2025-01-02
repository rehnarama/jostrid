use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::{
    api::util::internal_error,
    db::{
        self,
        expense::{AccountShare, Expense, InsertAccountShare, InsertExpense},
    },
    server::application::App,
};

use super::{expense_category::ExpenseCategoryDto, user::UserDto};

#[derive(Serialize)]
pub struct ExpenseDto {
    pub id: i32,
    pub name: String,
    pub total: i32,
    pub currency: String,
    pub created_at: chrono::DateTime<Utc>,
    pub is_payment: bool,
}

impl From<&Expense> for ExpenseDto {
    fn from(value: &Expense) -> Self {
        ExpenseDto {
            id: value.id,
            name: value.name.clone(),
            total: value.total,
            currency: value.currency.clone(),
            created_at: value.created_at,
            is_payment: value.is_payment,
        }
    }
}

#[derive(Serialize)]
pub struct AccountShareDto {
    pub expense_id: i32,
    pub user_id: i32,
    pub share: i32,
}

impl From<&AccountShare> for AccountShareDto {
    fn from(value: &AccountShare) -> Self {
        AccountShareDto {
            expense_id: value.expense_id,
            user_id: value.user_id,
            share: value.share,
        }
    }
}

#[derive(Serialize, Deserialize)]
struct UpsertExpenseDto {
    id: Option<i32>,
    name: String,
    created_at: Option<chrono::DateTime<Utc>>,
    paid_by: i32,
    total: i32,
    currency: String,
    category_id: Option<i32>,
    shares: Vec<UpsertAccountShareDto>,
    is_payment: bool,
}

#[derive(Serialize, Deserialize)]
struct UpsertAccountShareDto {
    user_id: i32,
    share: i32,
}

#[derive(Serialize)]
pub struct ExpenseWithEverythingDto {
    #[serde(flatten)]
    pub expense: ExpenseDto,
    pub paid_by: UserDto,
    pub category: Option<ExpenseCategoryDto>,
    shares: Vec<AccountShareDto>,
}

pub fn get_expense_api() -> Router<App> {
    Router::new()
        .route(
            "/",
            get(get_expenses)
                .put(upsert_expense)
                .delete(delete_expense),
        )
        .route("/:id", get(get_expense))
}

async fn get_expenses(
    State(app): State<App>,
) -> Result<Json<Vec<ExpenseWithEverythingDto>>, (StatusCode, String)> {
    let expenses = db::expense::get_expenses(&app.db)
        .await
        .map_err(internal_error)?;

    let dtos = expenses
        .iter()
        .map(|(expense, shares)| ExpenseWithEverythingDto {
            expense: (&expense.expense).into(),
            category: expense.category.as_ref().map(|category| category.into()),
            paid_by: (&expense.paid_by).into(),
            shares: shares.iter().map(|share| share.into()).collect(),
        })
        .collect::<Vec<_>>();

    Ok(Json(dtos))
}

async fn get_expense(
    Path(id): Path<i32>,
    State(app): State<App>,
) -> Result<Json<ExpenseWithEverythingDto>, (StatusCode, String)> {
    let expense = db::expense::get_expense(id, &app.db)
        .await
        .map_err(internal_error)?
        .map(|(expense, shares)| ExpenseWithEverythingDto {
            expense: (&expense.expense).into(),
            category: expense.category.as_ref().map(|category| category.into()),
            paid_by: (&expense.paid_by).into(),
            shares: shares.iter().map(|share| share.into()).collect(),
        })
        .ok_or_else(|| (StatusCode::NOT_FOUND, "Expense not found".to_string()))?;

    Ok(Json(expense))
}

async fn upsert_expense(
    State(app): State<App>,
    Json(expense): Json<UpsertExpenseDto>,
) -> Result<Json<ExpenseWithEverythingDto>, (StatusCode, String)> {
    let to_insert = InsertExpense {
        category_id: expense.category_id,
        created_at: expense.created_at,
        total: expense.total,
        currency: expense.currency,
        name: expense.name,
        paid_by: expense.paid_by,
        is_payment: expense.is_payment,
        shares: expense
            .shares
            .into_iter()
            .map(|share| InsertAccountShare {
                share: share.share,
                user_id: share.user_id,
            })
            .collect(),
    };

    let new_expense = match expense.id {
        Some(expense_id) => db::expense::update_expense(expense_id, to_insert, &app.db).await,
        None => db::expense::insert_expense(to_insert, &app.db).await,
    }
    .map_err(internal_error)?;

    Ok(Json(ExpenseWithEverythingDto {
        expense: (&new_expense.0.expense).into(),
        category: new_expense
            .0
            .category
            .as_ref()
            .map(|category| category.into()),
        paid_by: (&new_expense.0.paid_by).into(),
        shares: new_expense.1.iter().map(|share| share.into()).collect(),
    }))
}

async fn delete_expense() {
    todo!()
}
