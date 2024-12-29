import classNames from "classnames";
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
      <p
        className={classNames(
          {
            ["text-success"]: myShare.share > 0,
            ["text-danger"]: myShare.share < 0,
          },
          "text-xs",
          "text-right",
          "text-nowrap",
          "block",
          "font-bold"
        )}
      >
        {myShare.share > 0 ? "Du lånade ut" : "Du lånade"}
      </p>
      <p
        className={classNames(
          {
            ["text-success"]: myShare.share > 0,
            ["text-danger"]: myShare.share < 0,
          },
          "text-xs",
          "text-right",
          "block"
        )}
      >
        {formatter.format(Math.abs(myShare.share / 100))}
      </p>
    </div>
  );
};
