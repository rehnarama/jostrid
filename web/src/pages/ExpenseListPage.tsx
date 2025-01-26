import { useMemo, useState } from "react";
import { IconMoneybag, IconPlus } from "@tabler/icons-react";
import groupBy from "lodash-es/groupBy";

import classes from "./ExpenseListPage.module.css";
import { Expense, useExpenses } from "../hooks/useExpenses";
import { NewExpenseModal } from "../components/NewExpenseModal";
import { ExpenseAmount } from "../components/ExpenseAmount";
import {
  formatCurrency,
  getBalances,
  getPaidString,
  getPaymentString,
} from "../utils/expenseUtils";
import { useUsers } from "../hooks/useUser";
import {
  Avatar,
  Button,
  Divider,
  Listbox,
  ListboxItem,
  ListboxSection,
} from "@nextui-org/react";
import { useMe } from "../hooks/useMe";
import { SettleUpModal } from "../components/SettleUpModal";

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const PAGE_SIZE = 100;

export const ExpenseListPage = () => {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [newModalOpen, setNewModalOpen] = useState<boolean | Expense>(false);
  const [settleUpModalOpen, setSettleUpModalOpen] = useState(false);
  const { data: expenses } = useExpenses({ suspense: true });
  const { data: users } = useUsers();
  const me = useMe({ suspense: true }).data;

  const groupedExpenses = useMemo(() => {
    return groupBy(expenses.slice(0, limit), (expense) => {
      const time = new Date(expense.created_at).getTime();
      return time - (time % DAY_IN_MS);
    });
  }, [expenses, limit]);
  const dates = Object.keys(groupedExpenses).toSorted(
    (a, b) => Number(b) - Number(a)
  );

  const balances = getBalances(expenses);
  const myTotalPerCurrency: Record<string, number> = {};
  for (const currency in balances) {
    myTotalPerCurrency[currency] = balances[currency][me.id];
  }

  const allSettledUp = Object.values(myTotalPerCurrency).every(
    (total) => total === 0
  );

  return (
    <div className="page">
      <header className={classes.header}>
        {allSettledUp ? (
          <p>Allt är lika!</p>
        ) : (
          Object.entries(myTotalPerCurrency)
            .filter(([, total]) => total !== 0)
            .map(([currency, myTotal]) => {
              return (
                <p key={currency}>
                  {myTotal > 0 ? (
                    <>
                      Du ska få tillbaka{" "}
                      <span className="text-success">
                        {formatCurrency(Math.abs(myTotal), currency)}
                      </span>
                    </>
                  ) : (
                    <>
                      Du är skyldig{" "}
                      <span className="text-danger">
                        {formatCurrency(Math.abs(myTotal), currency)}
                      </span>
                    </>
                  )}
                </p>
              );
            })
        )}

        <Divider className="my-4" />

        <div className="flex flex-row gap-2">
          <Button
            startContent={<IconPlus />}
            onPress={() => setNewModalOpen((prev) => !prev)}
            color="primary"
          >
            Ny utgift
          </Button>
          <Button variant="bordered" onPress={() => setSettleUpModalOpen(true)}>
            Gör upp
          </Button>
        </div>
      </header>
      <Listbox aria-label="List of expenses">
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
                      !expense.is_payment
                        ? getPaidString(expense, users)
                        : undefined
                    }
                    startContent={
                      expense.is_payment ? (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <IconMoneybag />
                        </div>
                      ) : (
                        <Avatar
                          size="sm"
                          name={expense.category?.name ?? "Okänd"}
                          className="flex-shrink-0"
                        />
                      )
                    }
                    endContent={
                      !expense.is_payment ? (
                        <ExpenseAmount expense={expense} />
                      ) : undefined
                    }
                    onPress={() => setNewModalOpen(expense)}
                  >
                    {expense.is_payment
                      ? getPaymentString(expense, users)
                      : expense.name}
                  </ListboxItem>
                );
              })}
            </ListboxSection>
          );
        })}
      </Listbox>
      {limit < expenses.length && (
        <div className="flex justify-center my-2">
          <Button
            onPress={() => setLimit((oldLimit) => oldLimit + PAGE_SIZE)}
            variant="flat"
            color="secondary"
          >
            Ladda fler ({expenses.length - limit})
          </Button>
        </div>
      )}
      <NewExpenseModal
        open={newModalOpen !== false}
        expense={typeof newModalOpen === "object" ? newModalOpen : undefined}
        onClose={() => setNewModalOpen(false)}
      />
      <SettleUpModal
        open={settleUpModalOpen}
        onClose={() => setSettleUpModalOpen(false)}
        balances={balances}
      />
    </div>
  );
};
