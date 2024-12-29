use std::collections::HashMap;

use chrono::Utc;
use serde::Serialize;
use sqlx::{postgres::PgRow, FromRow, PgPool, Row};

use super::{expense_category::ExpenseCategory, user::User};

static GET_ALL_EXPENSE: &str = r#"
SELECT 
    e.id, 
    e.name, 
    e.created_at, 
    e.paid_by, 
    e.currency,
    e.is_payment,
    u.name as paid_by_name, 
    u.email as paid_by_email, 
    e.category_id, 
    ec.name as category_name 
FROM expense as e
LEFT JOIN users as u ON e.paid_by = u.id
LEFT JOIN expense_category as ec ON e.category_id = ec.id
ORDER BY e.created_at DESC;
"#;

static GET_ONE_EXPENSE: &str = r#"
SELECT 
    e.id, 
    e.name, 
    e.created_at, 
    e.paid_by, 
    e.currency,
    e.is_payment,
    u.name as paid_by_name, 
    u.email as paid_by_email, 
    e.category_id, 
    ec.name as category_name 
FROM expense as e
LEFT JOIN users as u ON e.paid_by = u.id
LEFT JOIN expense_category as ec ON e.category_id = ec.id
WHERE e.id = $1;
"#;

static INSERT_EXPENSE: &str = r#"
INSERT INTO expense (name, created_at, paid_by, currency, category_id, is_payment)
VALUES($1, $2, $3, $4, $5, $6)
RETURNING id;
"#;

static INSERT_SHARE: &str = r#"
INSERT INTO account_share (expense_id, user_id, share)
VALUES($1, $2, $3);
"#;

#[derive(sqlx::FromRow, Serialize, Clone)]
pub struct Expense {
    pub id: i32,
    pub name: String,
    pub currency: String,
    pub created_at: chrono::DateTime<Utc>,
    pub is_payment: bool,
}
pub struct InsertExpense {
    pub name: String,
    pub created_at: Option<chrono::DateTime<Utc>>,
    pub paid_by: i32,
    pub currency: String,
    pub category_id: Option<i32>,
    pub shares: Vec<InsertAccountShare>,
    pub is_payment: bool,
}

#[derive(sqlx::FromRow, Serialize, Clone, Copy)]
pub struct AccountShare {
    pub expense_id: i32,
    pub user_id: i32,
    pub share: i32,
}
pub struct InsertAccountShare {
    pub user_id: i32,
    pub share: i32,
}

pub struct ExpenseWithPayerAndCategory {
    pub expense: Expense,
    pub paid_by: User,
    pub category: Option<ExpenseCategory>,
}

impl FromRow<'_, PgRow> for ExpenseWithPayerAndCategory {
    fn from_row(row: &PgRow) -> Result<Self, sqlx::Error> {
        let expense = Expense::from_row(row)?;
        let paid_by = User {
            id: row.try_get("paid_by")?,
            name: row.try_get("paid_by_name")?,
            email: row.try_get("paid_by_email")?,
        };
        let category = if let Ok(name) = row.try_get("category_name") {
            Some(ExpenseCategory {
                id: row.try_get("category_id")?,
                name,
            })
        } else {
            None
        };

        Ok(ExpenseWithPayerAndCategory {
            expense,
            paid_by,
            category,
        })
    }
}

pub async fn get_expenses(
    pool: &PgPool,
) -> Result<Vec<(ExpenseWithPayerAndCategory, Vec<AccountShare>)>, sqlx::Error> {
    let expense_rows = sqlx::query_as::<_, ExpenseWithPayerAndCategory>(GET_ALL_EXPENSE)
        .fetch_all(pool)
        .await?;

    let expense_id_map: HashMap<_, _> = expense_rows
        .iter()
        .enumerate()
        .map(|(i, u)| (u.expense.id, i))
        .collect();
    let expense_ids: Vec<i32> = expense_id_map.keys().copied().collect();

    let shares =
        sqlx::query_as::<_, AccountShare>("SELECT * FROM account_share WHERE expense_id = ANY($1)")
            .bind(expense_ids)
            .fetch_all(pool)
            .await?;

    let mut result = expense_rows.iter().map(|_| Vec::new()).collect::<Vec<_>>();
    for share in shares {
        result[expense_id_map[&share.expense_id]].push(share);
    }

    Ok(expense_rows.into_iter().zip(result).collect::<Vec<_>>())
}

pub async fn get_expense(
    expense_id: i32,
    pool: &PgPool,
) -> Result<Option<(ExpenseWithPayerAndCategory, Vec<AccountShare>)>, sqlx::Error> {
    let result: Result<ExpenseWithPayerAndCategory, _> = sqlx::query_as(GET_ONE_EXPENSE)
        .bind(expense_id)
        .fetch_one(pool)
        .await;

    match result {
        Ok(expense) => {
            let shares: Vec<AccountShare> =
                sqlx::query_as("SELECT * FROM account_share WHERE expense_id = $1")
                    .bind(expense_id)
                    .fetch_all(pool)
                    .await?;

            Ok(Some((expense, shares)))
        }
        Err(sqlx::Error::RowNotFound) => Ok(None),
        Err(e) => Err(e),
    }
}

pub async fn insert_expense(
    expense: InsertExpense,
    pool: &PgPool,
) -> Result<(ExpenseWithPayerAndCategory, Vec<AccountShare>), sqlx::Error> {
    dbg!(expense.category_id);
    let expense_id: i32 = sqlx::query(INSERT_EXPENSE)
        .bind(expense.name)
        .bind(expense.created_at.unwrap_or(Utc::now()))
        .bind(expense.paid_by)
        .bind(expense.currency)
        .bind(expense.category_id)
        .bind(expense.is_payment)
        .map(|row| row.get("id"))
        .fetch_one(pool)
        .await?;

    for share in expense.shares {
        sqlx::query(INSERT_SHARE)
            .bind(expense_id)
            .bind(share.user_id)
            .bind(share.share)
            .execute(pool)
            .await?;
    }

    Ok(get_expense(expense_id, pool)
        .await?
        .expect("Failed to fetch after insert"))
}
