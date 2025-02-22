import { useRef, useState } from "react";
import { UserDto, useUsers } from "../hooks/useUser";
import { assert } from "../utils/assert";
import { useExpenses } from "../hooks/useExpenses";
import {
  Accordion,
  AccordionItem,
  addToast,
  Avatar,
  Button,
  Chip,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { CurrencyBalances, formatCurrency } from "../utils/expenseUtils";
import { MeDto, useMe } from "../hooks/useMe";
import { errorLikeToMessage, generateSwishLink } from "../lib/utils";

const UNKNOWN_USER: UserDto = {
  id: -1,
  name: "Unknown",
  phone_number: null,
};

export interface SettleUpModalProps {
  open?: boolean;
  onClose?: () => void;
  balances: CurrencyBalances;
}

interface Payment {
  payerId: number;
  receiverId: number;
  total: number;
  currency: string;
}

export const SettleUpModal = (props: SettleUpModalProps) => {
  const me = useMe({ suspense: true }).data;
  const users = useUsers().data;
  const [isSettlingUp, setIsSettlingUp] = useState(false);
  const expenses = useExpenses({ isPaused: () => true });

  const onRegisterPayment = async (
    { payerId, receiverId, total, currency }: Payment,
    openSwish = false,
  ) => {
    const payer = users.find((user) => user.id === payerId);
    const receiver = users.find((user) => user.id === receiverId);
    assert(payer, "Can't find payer");
    assert(receiver, "Can't find receiver");
    setIsSettlingUp(true);
    try {
      await expenses.upsert({
        currency,
        total,
        is_payment: true,
        name: `${payer.name} payed ${formatCurrency(total, currency)} to ${receiver.name}`,
        paid_by: payerId,
        shares: [
          {
            share: -total,
            user_id: receiverId,
          },
          {
            share: total,
            user_id: payerId,
          },
        ],
      });
      addToast({
        title: `Betalning på ${formatCurrency(total, currency)} registrerad`,
        color: "success",
      });

      if (openSwish) {
        assert(currency === "SEK", "Swish is only valid for SEK");
        assert(receiver.phone_number, "No phone number registered on receiver");

        const link = generateSwishLink(
          receiver.phone_number,
          total / 100,
          "Betalning via jostrid.se",
        );
        window.open(link, "_blank");
      }
      props.onClose?.();
    } catch (e) {
      addToast({
        title: "Misslyckades göra upp",
        description: errorLikeToMessage(e),
        color: "danger",
      });
    } finally {
      setIsSettlingUp(false);
    }
  };

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

  const myBalances = flatBalances.filter(({ user }) => user.id === me.id);
  const otherBalances = flatBalances
    .filter(({ user }) => user.id !== me.id)
    .filter(({ balance }) => balance !== 0);

  return (
    <Modal isOpen={props.open ?? false} onClose={props.onClose}>
      <ModalContent className="max-h-dvh overflow-y-auto">
        <ModalHeader>Välj ett saldo att göra upp</ModalHeader>
        <ModalBody>
          <div className="flex gap-1">
            <p>Dina saldon:</p>
            {myBalances.map((balance) => {
              return (
                <Chip
                  key={`${balance.currency}:${balance.balance}`}
                  size="sm"
                  color={
                    balance.balance < 0
                      ? "success"
                      : balance.balance > 0
                        ? "danger"
                        : "default"
                  }
                >
                  {formatCurrency(Math.abs(balance.balance), balance.currency)}
                </Chip>
              );
            })}
          </div>
          <Accordion aria-label="Non-even balances to settle up">
            {otherBalances.map((balance) => {
              return (
                <AccordionItem
                  key={`${balance.currency}:${balance.user.id}`}
                  startContent={
                    <Avatar
                      name={balance.user.name}
                      className="flex-shrink-0"
                    />
                  }
                  title={balance.user.name}
                  subtitle={
                    balance.balance > 0
                      ? `Ska få tillbaka ${formatCurrency(balance.balance, balance.currency)}`
                      : `Är skyldig ${formatCurrency(Math.abs(balance.balance), balance.currency)}`
                  }
                >
                  <h1 className="mb-1">Registrera betalning</h1>

                  <SettleUpBalanceForm
                    balance={balance}
                    onRegisterPayment={onRegisterPayment}
                    me={me}
                    users={users}
                    isSettlingUp={isSettlingUp}
                  />
                </AccordionItem>
              );
            })}
          </Accordion>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

interface SettleUpBalanceFormProps {
  balance: {
    currency: string;
    user: { id: number; name: string; phone_number: string | null };
    balance: number;
  };
  onRegisterPayment: (payment: Payment, openSwish?: boolean) => Promise<void>;
  isSettlingUp: boolean;
  me: MeDto;
  users: UserDto[];
}

function SettleUpBalanceForm({
  balance,
  onRegisterPayment,
  isSettlingUp,
  me,
  users,
}: SettleUpBalanceFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (openSwish: boolean = false) => {
    assert(formRef.current);

    // Get form data as an object.
    const data = new FormData(formRef.current);
    const payerId = Number(data.get("payer"));
    const receiverId = Number(data.get("receiver"));
    const total = Number(data.get("total")) * 100;

    onRegisterPayment(
      {
        payerId,
        receiverId,
        total,
        currency: balance.currency,
      },
      openSwish,
    );
  };
  return (
    <Form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="self-stretch flex flex-row gap-2">
        <Select
          label="Betalare"
          name="payer"
          defaultSelectedKeys={[
            String(balance.balance < 0 ? balance.user.id : me.id),
          ]}
          items={users}
        >
          {(user) => {
            return <SelectItem key={String(user.id)}>{user.name}</SelectItem>;
          }}
        </Select>
        <Select
          label="Mottagare"
          name="receiver"
          defaultSelectedKeys={[
            String(balance.balance < 0 ? me.id : balance.user.id),
          ]}
          items={users}
        >
          {(user) => {
            return <SelectItem key={String(user.id)}>{user.name}</SelectItem>;
          }}
        </Select>
      </div>
      <Input
        label="Summa"
        type="number"
        name="total"
        min={1}
        endContent={balance.currency}
        defaultValue={String(Math.abs(balance.balance / 100))}
      />
      <div className="self-stretch flex flex-row gap-1">
        <Button
          className="flex-1"
          color="primary"
          isLoading={isSettlingUp}
          type="submit"
        >
          Registrera
        </Button>
        {}
        <Button
          className="flex-1"
          color="primary"
          variant="bordered"
          isLoading={isSettlingUp}
          onPress={() => onSubmit(true)}
        >
          Registrera & Swisha
        </Button>
      </div>
    </Form>
  );
}
