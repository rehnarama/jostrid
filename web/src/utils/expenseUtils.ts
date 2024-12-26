import { Expense } from "../hooks/useExpenses";
import { User } from "../hooks/useUser";
import { assert } from "./assert";

export const getPaidString = (expense: Expense) => {
  const total = expense.shares
    .map((share) => Math.abs(share.share))
    .reduce((acc, share) => acc + share, 0);

  const formatter = new Intl.NumberFormat(navigator.languages, {
    style: "currency",
    currency: expense.currency,
  });

  return `${expense.paid_by.name} betalade ${formatter.format(total / 100)}`;
};

export const getPaymentString = (expense: Expense, users: User[]) => {
  assert(expense.is_payment, "Should only be used on payment expenses");

  const payerShare = expense.shares.find(
    (share) => share.user_id === expense.paid_by.id
  );
  assert(payerShare, "No payer found");
  const payerUser = users.find((user) => user.id === payerShare.user_id);
  assert(payerUser, "No payer user found");
  const receiverShare = expense.shares.find(
    (share) => share.user_id !== expense.paid_by.id
  );
  assert(receiverShare, "No receiver found");

  const receiverUser = users.find((user) => user.id === receiverShare.user_id);
  assert(receiverUser, "No user of the receiver found");

  const formatter = new Intl.NumberFormat(navigator.languages, {
    style: "currency",
    currency: expense.currency,
  });

  return `${payerUser.name} betalade ${formatter.format(payerShare.share / 100)} till ${receiverUser.name}`;
};
