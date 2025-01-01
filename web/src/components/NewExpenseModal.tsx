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
import { useMe } from "../hooks/useMe";

const AMOUNT_REGEX = /\d+([.,]\d+)?/;
const NUMBER_REGEX = /\d+/;

export interface NewExpenseModalProps {
  open?: boolean;
  onClose?: () => void;
}

export const NewExpenseModal = (props: NewExpenseModalProps) => {
  const toast = useToast();
  const categories = useExpenseCategory();
  const { create: createExpense } = useExpenses();
  const [currency] = useState("SEK");
  const { data: users } = useUsers();
  const { data: me } = useMe({ suspense: true });
  const [sharePercentage, setSharePercentage] = useState<number[]>(
    users.map(() => 100 / users.length)
  );

  const [isCreating, setIsCreating] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const name = data.get("name")?.toString() ?? "";
    const total = data.get("total")?.toString() ?? "";
    const paidBy = data.get("paidBy")?.toString() ?? "";
    const category = data.get("category")?.toString() ?? "";

    assert(typeof name === "string");
    assert(AMOUNT_REGEX.test(total));
    assert(NUMBER_REGEX.test(paidBy));

    const createExpenseDto: CreateExpenseDto = {
      created_at: new Date().toISOString(),
      currency,
      name,
      paid_by: Number(paidBy),
      total: Number(total) * 100,
      category_id: category ? Number(category) : undefined,
      shares: users.map((user, i) => {
        return {
          user_id: user.id,
          share:
            (user.id === Number(paidBy) ? -Number(total) * 100 : 0) +
            Math.round(Number(total) * sharePercentage[i]), // We actually have `* 100 / 100` here to go from [0, 100] -> [0, 1] and then to cents from full amount
        };
      }),
      is_payment: false,
    };

    try {
      setIsCreating(true);
      await createExpense(createExpenseDto);
      props.onClose?.();
    } catch (e) {
      toast.show("Failed to create expense", "danger");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={props.open ?? false} onClose={props.onClose}>
      <ModalContent>
        <ModalHeader>Ny utgift</ModalHeader>
        <ModalBody>
          <Form validationBehavior="native" onSubmit={onSubmit}>
            <Input label="Utgiftnamn" name="name" isRequired />

            <Input
              label="Totalt"
              name="total"
              type="number"
              endContent={currency}
              isRequired
            />

            <RadioGroup
              label="Betalare"
              name="paidBy"
              isRequired
              defaultValue={String(me.id)}
            >
              {users.map((user) => (
                <Radio key={user.id} value={String(user.id)}>
                  {user.name}
                </Radio>
              ))}
            </RadioGroup>

            <Slider
              label="Andel"
              name="share"
              minValue={0}
              maxValue={100}
              step={1}
              value={sharePercentage.slice(0, -1).map((percentage, i) => {
                const prevSum = sharePercentage
                  .slice(0, i)
                  .reduce((a, b) => a + b, 0);

                return prevSum + percentage;
              })}
              onChange={(values) => {
                assert(Array.isArray(values));

                let prev = 0;
                const shares: number[] = [];
                for (const value of values) {
                  shares.push(value - prev);
                  prev = value;
                }
                shares.push(100 - prev);
                setSharePercentage(shares);
              }}
              marks={users.map((user, i) => {
                const previous = sharePercentage
                  .slice(0, i)
                  .reduce((share, sum) => share + sum, 0);
                const next = sharePercentage
                  .slice(0, i + 1)
                  .reduce((share, sum) => share + sum, 0);

                return {
                  value: (previous + next) / 2,
                  label: `${user.name.slice(0, 1)}\u00A0(${sharePercentage[i]}%) `,
                };
              })}
            />

            <Select label="Kategori" name="category">
              {categories.data.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </Select>

            <Button
              className="self-stretch"
              type="submit"
              disabled={isCreating}
              isLoading={isCreating}
              color="primary"
            >
              Skapa
            </Button>
          </Form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
