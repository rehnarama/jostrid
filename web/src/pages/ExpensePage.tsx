import { useExpense } from "../hooks/useExpenses";
import { useParams } from "react-router";
import { assert } from "../utils/assert";
import { useToast } from "../hooks/useToast";
import { Button } from "@nextui-org/react";

export const ExpensePage = () => {
  const params = useParams();
  assert(params.id, "Param 'id' is required");
  const expense = useExpense(params.id).data;
  const toast = useToast();

  const total = expense.shares
    .map((share) => Math.abs(share.share))
    .reduce((acc, share) => acc + share, 0);

  return (
    <div>
      <Button
        onPress={() => {
          toast.show("hej");
        }}
      >
        show toast
      </Button>
      <h1>{expense.name}</h1>
      <h2>
        {total / 100}
        {expense.currency}
      </h2>
      <p>
        {expense.paid_by.name} paid {total / 100}
        {expense.currency}
      </p>
      <ul>
        {expense.shares.map((share) => (
          <li key={share.user_id}>{share.user_id}</li>
        ))}
      </ul>
    </div>
  );
};
