import { Expense } from "../hooks/useExpenses";
import { UserDto } from "../hooks/useUser";
import { assert } from "./assert";

export const formatCurrency = (amount: number, currency: string) => {
  const formatter = new Intl.NumberFormat(navigator.languages, {
    style: "currency",
    currency: currency,
  });

  return formatter.format(amount / 100);
};

export const getPaidString = (expense: Expense, users: UserDto[]) => {
  const payer = users.find((user) => user.id === expense.paid_by);

  assert(payer, "Couldn't find payer user");
  return `${payer.name} betalade ${formatCurrency(expense.total, expense.currency)}`;
};

export const getPaymentString = (expense: Expense, users: UserDto[]) => {
  assert(expense.is_payment, "Should only be used on payment expenses");

  const receiverShare = expense.shares.find((share) => share.share < 0);
  const payerShare = expense.shares.find((share) => share.share > 0);
  assert(receiverShare, "Found no negative share");
  assert(payerShare, "Found no positive share");

  const receiverUser = users.find((user) => user.id === receiverShare.user_id);
  const payerUser = users.find((user) => user.id === payerShare.user_id);
  assert(receiverUser, "No user of the receiver found");
  assert(payerUser, "No user of the receiver found");

  return `${payerUser.name} betalade ${formatCurrency(expense.total, expense.currency)} till ${receiverUser.name}`;
};

export type UserBalances = {
  [userId: number]: number;
};
export interface CurrencyBalances {
  [currency: string]: UserBalances;
}

export const getBalances = (expenses: Expense[]): CurrencyBalances => {
  const balances: CurrencyBalances = {};
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
