import {
  ExpenseCategory,
  useExpenseCategory,
} from "../hooks/useExpenseCategory";
import { FormEvent, useState } from "react";
import { UserDto, useUsers } from "../hooks/useUser";
import { assert } from "../utils/assert";
import { Expense, UpsertExpenseDto, useExpenses } from "../hooks/useExpenses";
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
import { MeDto, useMe } from "../hooks/useMe";
import { errorLikeToMessage } from "../lib/utils";
import { IconDivide, IconMinus, IconPlus, IconX } from "@tabler/icons-react";
import { evaluateExpression } from "../utils/math";
import { formatCurrency } from "../utils/expenseUtils";
import { CategoryIcon } from "./CategoryIcon";

const NUMBER_REGEX = /\d+/;

interface NewExpenseModalContentProps {
  expense?: Expense;
  onClose?: () => void;
  me: MeDto;
  users: UserDto[];
  categories: ExpenseCategory[];
}

const NewExpenseModalContent = ({
  expense,
  onClose,
  me,
  users: unsortedUsers,
  categories,
}: NewExpenseModalContentProps) => {
  const users = unsortedUsers.toSorted((a, b) => a.id - b.id);

  const toast = useToast();
  const { upsert: upsertExpense, remove: removeExpense } = useExpenses({
    isPaused: () => true,
  });
  const [currency] = useState("SEK");
  const [sharePercentage, setSharePercentage] = useState<number[]>(
    expense
      ? expense.shares
          .toSorted((a, b) => a.user_id - b.user_id)
          .map(
            (share) =>
              Math.round(
                100 *
                  (expense.paid_by === share.user_id
                    ? expense.total - share.share
                    : -share.share)
              ) / expense.total
          )
      : users.map(() => 100 / users.length)
  );
  const [total, setTotal] = useState(
    expense ? String(expense.total / 100) : ""
  );

  const [isCreating, setIsCreating] = useState(false);
  const [showOperations, setShowOperations] = useState(false);

  const deleteExpense = () => {
    assert(expense, "No expense found");

    removeExpense(expense.id);
    onClose?.();
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const name = data.get("name")?.toString() ?? "";
    const total = evaluateExpression(data.get("total")?.toString() ?? "");
    const paidBy = data.get("paidBy")?.toString() ?? "";
    const category = data.get("category")?.toString() ?? "";

    assert(typeof name === "string");
    assert(NUMBER_REGEX.test(paidBy));

    const createExpenseDto: UpsertExpenseDto = {
      id: expense?.id,
      created_at: expense?.created_at ?? new Date().toISOString(),
      currency,
      name,
      paid_by: Number(paidBy),
      total: Number(total) * 100,
      category_id: category ? Number(category) : undefined,
      shares: users.map((user, i) => {
        return {
          user_id: user.id,
          share:
            (user.id === Number(paidBy) ? Number(total) * 100 : 0) +
            -Math.round(Number(total) * sharePercentage[i]), // We actually have `* 100 / 100` here to go from [0, 100] -> [0, 1] and then to cents from full amount
        };
      }),
      is_payment: false,
    };

    try {
      setIsCreating(true);
      await upsertExpense(createExpenseDto);
      onClose?.();
    } catch (e) {
      toast.show("Failed to create expense", errorLikeToMessage(e), "danger");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ModalContent className="max-h-dvh overflow-y-auto">
      <ModalHeader>{expense ? "Uppdatera Utgift" : "Ny utgift"}</ModalHeader>
      <ModalBody>
        {expense?.is_payment ? (
          <Button
            className="flex-1"
            color="danger"
            variant="bordered"
            onPress={deleteExpense}
          >
            Ta bort
          </Button>
        ) : (
          <Form validationBehavior="native" onSubmit={onSubmit}>
            <Input
              label="Utgiftnamn"
              name="name"
              isRequired
              defaultValue={expense?.name}
            />

            <Input
              label="Totalt"
              name="total"
              endContent={
                /[+-/*]/g.test(total)
                  ? formatCurrency(evaluateExpression(total) * 100, currency)
                  : currency
              }
              isRequired
              inputMode="numeric"
              value={total}
              onFocus={() => setShowOperations(true)}
              onBlur={() => setShowOperations(false)}
              onChange={(e) => setTotal(e.target.value)}
            />
            {showOperations && (
              <div className="fixed bottom-0 left-0 right-0 p-2 bg-slate-100 flex justify-center gap-1 z-50">
                <Button
                  className="flex-shrink"
                  variant="flat"
                  isIconOnly
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setTotal((total) => total + "+");
                  }}
                >
                  <IconPlus />
                </Button>
                <Button
                  className="flex-shrink"
                  variant="flat"
                  isIconOnly
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setTotal((total) => total + "-");
                  }}
                >
                  <IconMinus />
                </Button>
                <Button
                  className="flex-shrink"
                  variant="flat"
                  isIconOnly
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setTotal((total) => total + "*");
                  }}
                >
                  <IconX />
                </Button>
                <Button
                  className="flex-shrink"
                  variant="flat"
                  isIconOnly
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setTotal((total) => total + "/");
                  }}
                >
                  <IconDivide />
                </Button>
              </div>
            )}

            <RadioGroup
              label="Betalare"
              name="paidBy"
              isRequired
              defaultValue={expense ? String(expense.paid_by) : String(me.id)}
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

            <Select
              label="Kategori"
              name="category"
              defaultSelectedKeys={
                expense?.category ? [String(expense.category)] : undefined
              }
              items={categories}
            >
              {(category) => (
                <SelectItem
                  key={category.id}
                  startContent={<CategoryIcon category={category} />}
                >
                  {category.name}
                </SelectItem>
              )}
            </Select>

            <div className="self-stretch flex flex-row gap-1">
              <Button
                className="flex-1"
                type="submit"
                disabled={isCreating}
                isLoading={isCreating}
                color="primary"
              >
                {expense ? "Spara" : "Skapa"}
              </Button>
              {expense && (
                <Button
                  className="flex-1"
                  color="danger"
                  variant="bordered"
                  onPress={deleteExpense}
                >
                  Ta bort
                </Button>
              )}
            </div>
          </Form>
        )}
      </ModalBody>
    </ModalContent>
  );
};

export interface NewExpenseModalProps {
  expense?: Expense;
  open?: boolean;
  onClose?: () => void;
}

export const NewExpenseModal = (props: NewExpenseModalProps) => {
  const { data: categories } = useExpenseCategory();
  const { data: users } = useUsers();
  const { data: me } = useMe({ suspense: true });

  return (
    <Modal isOpen={props.open} onClose={props.onClose}>
      <NewExpenseModalContent
        expense={props.expense}
        onClose={props.onClose}
        categories={categories}
        users={users}
        me={me}
      />
    </Modal>
  );
};
