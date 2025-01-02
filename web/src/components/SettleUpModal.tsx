import { useState } from "react";
import { User, useUsers } from "../hooks/useUser";
import { assert } from "../utils/assert";
import { useExpenses } from "../hooks/useExpenses";
import { useToast } from "../hooks/useToast";
import {
  Accordion,
  AccordionItem,
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
} from "@nextui-org/react";
import { Balances, formatCurrency } from "../utils/expenseUtils";
import { useMe } from "../hooks/useMe";
import { errorLikeToMessage } from "../lib/utils";

const UNKNOWN_USER: User = {
  id: -1,
  name: "Unknown",
};

export interface SettleUpModalProps {
  open?: boolean;
  onClose?: () => void;
  balances: Balances;
}

export const SettleUpModal = (props: SettleUpModalProps) => {
  const me = useMe({ suspense: true }).data;
  const users = useUsers().data;
  const expenses = useExpenses({ isPaused: () => true });
  const [isSettlingUp, setIsSettlingUp] = useState(false);
  const toast = useToast();

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
    }
  );

  const myBalances = flatBalances.filter(({ user }) => user.id === me.id);
  const otherBalances = flatBalances
    .filter(({ user }) => user.id !== me.id)
    .filter(({ balance }) => balance !== 0);

  const onRegisterPayment = async (
    payerId: number,
    receiverId: number,
    total: number,
    currency: string
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
      toast.show(
        `Betalning på ${formatCurrency(total, currency)} registrerad`,
        undefined,
        "success"
      );
      props.onClose?.();
    } catch (e) {
      toast.show("Misslyckades göra upp", errorLikeToMessage(e), "danger");
    } finally {
      setIsSettlingUp(false);
    }
  };

  return (
    <Modal isOpen={props.open ?? false} onClose={props.onClose}>
      <ModalContent>
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
                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();

                      // Get form data as an object.
                      const data = new FormData(e.currentTarget);
                      const payer = Number(data.get("payer"));
                      const receiver = Number(data.get("receiver"));
                      const total = Number(data.get("total")) * 100;

                      onRegisterPayment(
                        payer,
                        receiver,
                        total,
                        balance.currency
                      );
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
                          return (
                            <SelectItem key={String(user.id)}>
                              {user.name}
                            </SelectItem>
                          );
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
                          return (
                            <SelectItem key={String(user.id)}>
                              {user.name}
                            </SelectItem>
                          );
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
                    </div>
                  </Form>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
