import { z } from "zod";
import { useData } from "./useData";
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

export type CreateAccountShareDto = {
  user_id: number;
  share: number;
};
export type CreateExpenseDto = {
  name: string;
  created_at: string;
  paid_by: number;
  total: number;
  currency: string;
  category_id?: number | undefined;
  shares: CreateAccountShareDto[];
  is_payment: boolean;
};

export const useExpenses = () => {
  const result = useData("/api/expense", Expense.array(), { suspense: true });

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
