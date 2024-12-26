import { Typography } from "@mui/joy";
import { Expense } from "../hooks/useExpenses";

export interface ExpenseAmountProps {
  expense: Expense;
}

const USER_ID = 1;

export const ExpenseAmount = ({ expense }: ExpenseAmountProps) => {
  const myShare = expense.shares.find((share) => share.user_id === USER_ID);

  const formatter = new Intl.NumberFormat(navigator.languages, {
    style: "currency",
    currency: expense.currency,
  });

  if (myShare === undefined) {
    return null;
  }
  return (
    <div>
      <Typography
        color={myShare.share > 0 ? "success" : "danger"}
        level="title-sm"
        textAlign="right"
        sx={{ display: "block" }}
      >
        {myShare.share > 0 ? "Du lånade ut" : "Du lånade"}
      </Typography>
      <Typography
        color={myShare.share > 0 ? "success" : "danger"}
        level="body-sm"
        textAlign="right"
        sx={{ display: "block" }}
      >
        {formatter.format(Math.abs(myShare.share / 100))}
      </Typography>
    </div>
  );
};
