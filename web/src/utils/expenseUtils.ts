import { Expense } from "../hooks/useExpenses";
import { User } from "../hooks/useUser";
import { assert } from "./assert";

export const formatCurrency = (amount: number, currency: string) => {
  const formatter = new Intl.NumberFormat(navigator.languages, {
    style: "currency",
    currency: currency,
  });

  return formatter.format(amount / 100);
};

export const getPaidString = (expense: Expense) => {
  return `${expense.paid_by.name} betalade ${formatCurrency(expense.total, expense.currency)}`;
};

export const getPaymentString = (expense: Expense, users: User[]) => {
  assert(expense.is_payment, "Should only be used on payment expenses");

  const receiverUser = users.find((user) => user.id !== expense.paid_by.id);
  assert(receiverUser, "No user of the receiver found");

  return `${expense.paid_by.name} betalade ${formatCurrency(expense.total, expense.currency)} till ${receiverUser.name}`;
};

export interface Balances {
  [currency: string]: {
    [userId: number]: number;
  };
}

export const getBalances = (expenses: Expense[]): Balances => {
  const balances: Balances = {};
  for (const expense of expenses) {
    const currencyBalance = balances[expense.currency] ?? {};

    for (const share of expense.shares) {
      currencyBalance[share.user_id] =
        (currencyBalance[share.user_id] ?? 0) + share.share;
    }

    balances[expense.currency] = currencyBalance;
  }

  return balances;
};
