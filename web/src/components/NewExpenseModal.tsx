import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalDialog,
  Option,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Stack,
  Typography,
} from "@mui/joy";
import { useExpenseCategory } from "../hooks/useExpenseCategory";
import { FormEvent, useState } from "react";
import { useUsers } from "../hooks/useUser";
import { assert } from "../utils/assert";
import { CreateExpenseDto, useExpenses } from "../hooks/useExpenses";
import { useToast } from "../hooks/useToast";
// import classes from "./NewExpenseModal.module.css";

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
  const [currency, _setCurrency] = useState("SEK");
  const { data: users } = useUsers();
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
      category_id: category ? Number(category) : undefined,
      shares: users.map((user, i) => {
        return {
          user_id: user.id,
          share: Math.round(Number(total) * sharePercentage[i] * 100), // Round to closest 'cent'
        };
      }),
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
    <Modal open={props.open ?? false} onClose={props.onClose}>
      <ModalDialog variant="outlined">
        <Typography>Ny utgift</Typography>
        <form onSubmit={onSubmit}>
          <Stack direction="column" spacing={2}>
            <FormControl required>
              <FormLabel>Namn</FormLabel>
              <Input name="name" placeholder="T.ex. willys" />
            </FormControl>

            <FormControl required>
              <FormLabel>Totalt</FormLabel>
              <Input name="total" type="number" endDecorator={currency} />
            </FormControl>

            <FormControl required>
              <FormLabel>Betalare</FormLabel>
              <RadioGroup name="paidBy">
                {users.map((user) => (
                  <Radio key={user.id} value={user.id} label={user.name} />
                ))}
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Andel</FormLabel>
              <Box paddingLeft={2} paddingRight={2}>
                <Slider
                  name="share"
                  min={0}
                  max={100}
                  step={1}
                  track={false}
                  value={sharePercentage.slice(0, -1).map((percentage, i) => {
                    const prevSum = sharePercentage
                      .slice(0, i)
                      .reduce((a, b) => a + b, 0);

                    return prevSum + percentage;
                  })}
                  onChange={(_, values) => {
                    assert(Array.isArray(values));

                    let prev = 0;
                    let shares: number[] = [];
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
                      label: `${user.name.slice(0, 1)} (${sharePercentage[i]}%) `,
                    };
                  })}
                />
              </Box>
            </FormControl>

            <FormControl>
              <FormLabel>Kategori</FormLabel>
              <Select name="category">
                {categories.data.map((category) => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              <Button
                sx={{ flex: 1 }}
                type="submit"
                disabled={isCreating}
                endDecorator={
                  isCreating ? <CircularProgress size="sm" /> : null
                }
              >
                Skapa
              </Button>
              <Button
                sx={{ flex: 1 }}
                onClick={props.onClose}
                variant="outlined"
              >
                Avbryt
              </Button>
            </Stack>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
};
