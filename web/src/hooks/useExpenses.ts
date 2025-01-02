import { z } from "zod";
import { useData } from "./useData";
import { SWRConfiguration } from "swr";
const { VITE_BACKEND_URL } = import.meta.env;

export const PaidBy = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
});
export type PaidBy = z.infer<typeof PaidBy>;

export const Share = z.object({
  expense_id: z.number(),
  user_id: z.number(),
  share: z.number(),
});
export type Share = z.infer<typeof Share>;

export const Category = z.object({
  id: z.number(),
  name: z.string(),
});

export const Expense = z.object({
  id: z.number(),
  name: z.string(),
  total: z.number(),
  currency: z.string(),
  created_at: z.string().datetime(),
  paid_by: PaidBy,
  category: Category.nullable(),
  shares: z.array(Share),
  is_payment: z.boolean(),
});
export type Expense = z.infer<typeof Expense>;

export const CreateAccountShareDto = z.object({
  user_id: z.number(),
  share: z.number(),
});
export type CreateAccountShareDto = z.infer<typeof CreateAccountShareDto>;

export const CreateExpenseDto = z.object({
  name: z.string(),
  created_at: z.string().optional(),
  paid_by: z.number(),
  total: z.number(),
  currency: z.string(),
  category_id: z.number().optional(),
  shares: z.array(CreateAccountShareDto),
  is_payment: z.boolean(),
});
export type CreateExpenseDto = z.infer<typeof CreateExpenseDto>;

export const useExpenses = <C extends SWRConfiguration>(config?: C) => {
  const result = useData(
    "/api/expense",
    Expense.array(),
    config ?? { suspense: true }
  );

  const create = async (createExpenseDto: CreateExpenseDto) => {
    const response = await fetch(`${VITE_BACKEND_URL}/api/expense`, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify(createExpenseDto),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const newExpense = Expense.parse(await response.json());

    result.mutate((current = []) => {
      return [newExpense, ...current];
    });
  };

  return { ...result, create };
};

export const useExpense = (id: number | string) => {
  return useData(`/api/expense/${id}`, Expense, { suspense: true });
};
