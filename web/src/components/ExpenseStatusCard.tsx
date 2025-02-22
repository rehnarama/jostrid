import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Listbox,
  ListboxItem,
} from "@heroui/react";
import { IconPlus } from "@tabler/icons-react";
import { CurrencyBalances, formatCurrency } from "../utils/expenseUtils";
import { useMe } from "../hooks/useMe";
import classNames from "classnames";
import { UserDto, useUsers } from "../hooks/useUser";
import { FlatBalance } from "./SettleUpModal";

const UNKNOWN_USER: UserDto = {
  id: -1,
  name: "Unknown",
  phone_number: null,
};

export interface ExpenseStatusCardProps {
  balances: CurrencyBalances;
  onAddPressed: () => void;
  onSettleUpPressed: (balance: FlatBalance) => void;
}

const POSITIVE_BALANCE_BG = "bg-gradient-to-l from-green-300 to-green-600";
const NEGATIVE_BALANCE_BG = "bg-gradient-to-l from-red-300 to-red-600";
const NEUTRAL_BALANCE = "bg-gradient-to-r from-sky-500 to-indigo-500";

export const ExpenseStatusCard = (props: ExpenseStatusCardProps) => {
  const { balances, onAddPressed, onSettleUpPressed } = props;
  const me = useMe({ suspense: true }).data;
  const users = useUsers().data;

  const myTotalPerCurrency: Record<string, number> = {};
  for (const currency in balances) {
    myTotalPerCurrency[currency] = balances[currency][me.id];
  }

  const allPositive = Object.values(myTotalPerCurrency).every(
    (balance) => balance > 0,
  );
  const allNegative = Object.values(myTotalPerCurrency).every(
    (balance) => balance < 0,
  );

  const flatBalances = Object.entries(props.balances).flatMap(
    ([currency, currencyBalance]) => {
      return Object.entries(currencyBalance).map(([userId, balance]) => {
        const user =
          users.find((user) => user.id === Number(userId)) ?? UNKNOWN_USER;

        return {
          currency,
          user,
          balance,
        };
      });
    },
  );

  const otherBalances = flatBalances
    .filter(({ user }) => user.id !== me.id)
    .filter(({ balance }) => balance !== 0);

  return (
    <Card
      className={classNames({
        "m-2 text-white/90": true,
        [NEUTRAL_BALANCE]: true,
        [POSITIVE_BALANCE_BG]: allPositive,
        [NEGATIVE_BALANCE_BG]: allNegative,
      })}
    >
      <CardHeader>
        <p className="text-tiny uppercase font-bold">Saldon</p>
      </CardHeader>
      <CardBody>
        <Listbox
          aria-label="Non-even balances to settle up"
          items={otherBalances}
          className={classNames({
            ["bg-white/50 rounded-md"]: true,
          })}
          emptyContent={
            <span className="m-2 text-black/90">Allt är lika!</span>
          }
        >
          {(balance) => {
            return (
              <ListboxItem
                className="text-black"
                onPress={() => onSettleUpPressed(balance)}
                key={`${balance.currency}:${balance.user.id}`}
                startContent={
                  <Avatar name={balance.user.name} className="flex-shrink-0" />
                }
                title={balance.user.name}
                description={
                  balance.balance > 0
                    ? `Ska få tillbaka ${formatCurrency(balance.balance, balance.currency)}`
                    : `Är skyldig ${formatCurrency(Math.abs(balance.balance), balance.currency)}`
                }
              ></ListboxItem>
            );
          }}
        </Listbox>
      </CardBody>

      <CardFooter className="flex flex-row gap-2">
        <Button
          size="sm"
          startContent={<IconPlus />}
          onPress={onAddPressed}
          variant="flat"
        >
          Ny utgift
        </Button>
      </CardFooter>
    </Card>
  );
};
