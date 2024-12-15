import { LinearProgress, Typography } from "@mui/joy";
import { useExpense } from "../hooks/useExpenses";
import { useParams } from "react-router";
import { assert } from "../utils/assert";

export const ExpensePage = () => {
  const params = useParams();
  assert(params.id, "Param 'id' is required");
  const expense = useExpense(params.id).data;

  if (!expense) {
    return <LinearProgress />;
  }

  const total = expense.shares
    .map((share) => Math.abs(share.share))
    .reduce((acc, share) => acc + share, 0);

  return (
    <div>
      <Typography level="h1">{expense.name}</Typography>
      <Typography level="h2">
        {total / 100}
        {expense.currency}
      </Typography>
      <Typography>
        {expense.paid_by.name} paid {total / 100}
        {expense.currency}
      </Typography>
      <ul>
        {expense.shares.map((share) => (
          <li key={share.user_id}>{share.user_id}</li>
        ))}
      </ul>
    </div>
  );
};
