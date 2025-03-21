import { useMemo, useState } from "react";
import { IconMoneybag } from "@tabler/icons-react";
import groupBy from "lodash-es/groupBy";

import { Expense, useExpenses } from "../hooks/useExpenses";
import { NewExpenseModal } from "../components/NewExpenseModal";
import { ExpenseAmount } from "../components/ExpenseAmount";
import {
  getBalances,
  getPaidString,
  getPaymentString,
} from "../utils/expenseUtils";
import { useUsers } from "../hooks/useUser";
import { Button, Listbox, ListboxItem, ListboxSection } from "@heroui/react";
import { useMe } from "../hooks/useMe";
import { FlatBalance, SettleUpModal } from "../components/SettleUpModal";
import { CategoryIcon } from "../components/CategoryIcon";
import { ExpenseStatusCard } from "../components/ExpenseStatusCard";

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const PAGE_SIZE = 100;

export const ExpenseListPage = () => {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [newModalOpen, setNewModalOpen] = useState<boolean | Expense>(false);
  const [balanceToSettleUp, setSettleBalanceToSettleUp] = useState<
    FlatBalance | undefined
  >(undefined);
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
    (a, b) => Number(b) - Number(a),
  );

  const balances = getBalances(expenses);
  const myTotalPerCurrency: Record<string, number> = {};
  for (const currency in balances) {
    myTotalPerCurrency[currency] = balances[currency][me.id];
  }

  return (
    <div className="page">
      <ExpenseStatusCard
        balances={balances}
        onAddPressed={() => setNewModalOpen(true)}
        onSettleUpPressed={setSettleBalanceToSettleUp}
      />
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
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        {expense.is_payment ? (
                          <IconMoneybag />
                        ) : (
                          <CategoryIcon category={expense.category} />
                        )}
                      </div>
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
        open={balanceToSettleUp !== undefined}
        onClose={() => setSettleBalanceToSettleUp(undefined)}
        balance={balanceToSettleUp}
      />
    </div>
  );
};
