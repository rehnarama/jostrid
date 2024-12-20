use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::{
    api::util::internal_error,
    db::{
        self,
        expense::{AccountShare, Expense, InsertAccountShare, InsertExpense},
    },
};

use super::{expense_category::ExpenseCategoryDto, user::UserDto};

#[derive(Serialize)]
pub struct ExpenseDto {
    pub id: i32,
    pub name: String,
    pub currency: String,
    pub created_at: chrono::DateTime<Utc>,
}

impl From<&Expense> for ExpenseDto {
    fn from(value: &Expense) -> Self {
        ExpenseDto {
            id: value.id,
            name: value.name.clone(),
            currency: value.currency.clone(),
            created_at: value.created_at.clone(),
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
struct CreateExpenseDto {
    name: String,
    created_at: Option<chrono::DateTime<Utc>>,
    paid_by: i32,
    currency: String,
    category_id: Option<i32>,
    shares: Vec<CreateAccountShareDto>,
}

#[derive(Serialize, Deserialize)]
struct CreateAccountShareDto {
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

pub fn get_expense_api(pool: PgPool) -> Router {
    Router::new()
        .route(
            "/",
            get(get_expenses)
                .patch(update_expense)
                .post(create_expense)
                .delete(delete_expense),
        )
        .route("/:id", get(get_expense))
        .with_state(pool)
}

async fn get_expenses(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<ExpenseWithEverythingDto>>, (StatusCode, String)> {
    let expenses = db::expense::get_expenses(&pool)
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
    State(pool): State<PgPool>,
) -> Result<Json<ExpenseWithEverythingDto>, (StatusCode, String)> {
    let expense = db::expense::get_expense(id, &pool)
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

async fn update_expense() -> Json<ExpenseWithEverythingDto> {
    todo!()
}

async fn create_expense(
    State(pool): State<PgPool>,
    Json(expense): Json<CreateExpenseDto>,
) -> Result<Json<ExpenseWithEverythingDto>, (StatusCode, String)> {
    let to_insert = InsertExpense {
        category_id: expense.category_id,
        created_at: expense.created_at,
        currency: expense.currency,
        name: expense.name,
        paid_by: expense.paid_by,
        shares: expense
            .shares
            .into_iter()
            .map(|share| InsertAccountShare {
                share: share.share,
                user_id: share.user_id,
            })
            .collect(),
    };

    let new_expense = db::expense::insert_expense(to_insert, &pool)
        .await
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
