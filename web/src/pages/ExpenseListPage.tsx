import { useMemo, useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import groupBy from "lodash-es/groupBy";

import classes from "./ExpenseListPage.module.css";
import { Link } from "../components/Link";
import { useExpenses } from "../hooks/useExpenses";
import { NewExpenseModal } from "../components/NewExpenseModal";
import { ExpenseAmount } from "../components/ExpenseAmount";
import { getPaidString, getPaymentString } from "../utils/expenseUtils";
import { useUsers } from "../hooks/useUser";
import {
  Avatar,
  Button,
  Listbox,
  ListboxItem,
  ListboxSection,
} from "@nextui-org/react";

const PAGE_SIZE = 10;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const ExpenseListPage = () => {
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { data: expenses } = useExpenses();
  const { data: users } = useUsers();
  const groupedExpenses = useMemo(() => {
    return groupBy(expenses, (expense) => {
      const time = new Date(expense.created_at).getTime();
      return time - (time % DAY_IN_MS);
    });
  }, [expenses]);
  const dates = Object.keys(groupedExpenses).toSorted(
    (a, b) => Number(b) - Number(a)
  );

  return (
    <div>
      <header className={classes.header}>
        <h1 className="text-4xl mb-2">Utgifter</h1>
        <Button
          startContent={<IconPlus />}
          onPress={() => setNewModalOpen((prev) => !prev)}
          color="primary"
        >
          Ny utgift
        </Button>
      </header>
      <Listbox>
        {dates.map((date) => {
          const expenses = groupedExpenses[date];
          return (
            <ListboxSection
              key={date}
              title={new Date(Number(date)).toLocaleDateString()}
            >
              {expenses.map((expense) => {
                return (
                  <ListboxItem
                    key={expense.id}
                    description={
                      expense.is_payment
                        ? getPaymentString(expense, users)
                        : getPaidString(expense)
                    }
                    startContent={
                      <Avatar
                        size="sm"
                        name={expense.category?.name ?? "Okänd"}
                        className="flex-shrink-0"
                      />
                    }
                    endContent={<ExpenseAmount expense={expense} />}
                    href={`/expense/${expense.id}`}
                  >
                    {expense.name}
                  </ListboxItem>
                );
              })}
            </ListboxSection>
          );
        })}
      </Listbox>
      <NewExpenseModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
      />
    </div>
  );
};
