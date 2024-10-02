import { Heading, Text } from "react-aria-components";
import { useParams } from "react-router";
import { useTypedRouteLoaderData } from "../hooks/useTypedLoaderData";
import { Expense } from "../loaders/ExpenseLoader";
import { assert } from "../utils/assert";

export const ExpensePage = () => {
  const params = useParams();
  const expenses = useTypedRouteLoaderData("expense", Expense.array());
  const current = expenses.find((expense) => expense.id === Number(params.id));
  assert(current, "Not found!");

  const total = current.shares
    .map((share) => Math.abs(share.share))
    .reduce((acc, share) => acc + share, 0);

  return (
    <div>
      <Heading level={1}>{current.name}</Heading>
      <Heading level={2}>
        {total / 100}
        {current.currency}
      </Heading>
      <Text>
        {current.paid_by.name} paid {total / 100}
        {current.currency}
      </Text>
      <ul>
        {current.shares.map(share => (
          <li>
            {share.user_id}

          </li>
        ))}
      </ul>
    </div>
  );
};
