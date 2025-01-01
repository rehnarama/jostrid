import { useExpenseCategory } from "../hooks/useExpenseCategory";
import { FormEvent, useState } from "react";
import { useUsers } from "../hooks/useUser";
import { assert } from "../utils/assert";
import { CreateExpenseDto, useExpenses } from "../hooks/useExpenses";
import { useToast } from "../hooks/useToast";
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Slider,
} from "@nextui-org/react";
import { Balances } from "../utils/expenseUtils";
import { useMe } from "../hooks/useMe";

const AMOUNT_REGEX = /\d+([.,]\d+)?/;
const NUMBER_REGEX = /\d+/;

export interface SettleUpModalProps {
  open?: boolean;
  onClose?: () => void;
  balances: Balances;
}

export const SettleUpModal = (props: SettleUpModalProps) => {
  const me = useMe({ suspense: true }).data;
  const users = useUsers().data;

  const toast = useToast();

  const debtBalances = Object.entries(props.balances)
    .flatMap(([currency, currencyBalances]) => {
      return Object.entries(currencyBalances).map(([userId, balance]) => {
        return {
          currency,
          userId,
          balance,
        };
      });
    })
    .filter((debt) => debt.balance !== 0);

  return (
    <Modal isOpen={props.open ?? false} onClose={props.onClose}>
      <ModalContent>
        <ModalHeader>Välj ett saldo att göra upp</ModalHeader>
        <ModalBody>
          {debtBalances.map((balance) => {
            return (
              <p key={`${balance.currency}:${balance.userId}`}>
                {JSON.stringify(balance)}
              </p>
            );
          })}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
