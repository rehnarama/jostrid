import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@heroui/react";
import { IconPlus, IconScale } from "@tabler/icons-react";
import { formatCurrency, getBalances } from "../utils/expenseUtils";
import { useExpenses } from "../hooks/useExpenses";
import { useMe } from "../hooks/useMe";

export interface ExpenseStatusCardProps {
  onAddPressed: () => void;
  onSettleUpPressed: () => void;
}

export const ExpenseStatusCard = (props: ExpenseStatusCardProps) => {
  const { data: expenses } = useExpenses({ suspense: true });
  const me = useMe({ suspense: true }).data;

  const balances = getBalances(expenses);

  const myTotalPerCurrency: Record<string, number> = {};
  for (const currency in balances) {
    myTotalPerCurrency[currency] = balances[currency][me.id];
  }

  const allSettledUp = Object.values(myTotalPerCurrency).every(
    (total) => total === 0
  );

  return (
    <Card className="m-2">
      <CardHeader>
        <p className="text-small font-bold">Saldo</p>
      </CardHeader>
      <CardBody>
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
      </CardBody>

      <CardFooter className="flex flex-row gap-2">
        <Button
          size="sm"
          startContent={<IconPlus />}
          onPress={props.onAddPressed}
          variant="flat"
        >
          Ny utgift
        </Button>
        <Button
          size="sm"
          variant="flat"
          startContent={<IconScale />}
          onPress={props.onSettleUpPressed}
        >
          Gör upp
        </Button>
      </CardFooter>
    </Card>
  );
};
