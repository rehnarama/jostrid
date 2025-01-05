import { z } from "zod";
import { useData } from "./useData";
import { SWRConfiguration } from "swr";
import { useApiClient } from "./useApiClient";

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

export const UpsertAccountShareDto = z.object({
  user_id: z.number(),
  share: z.number(),
});
export type UpsertAccountShareDto = z.infer<typeof UpsertAccountShareDto>;

export const UpsertExpenseDto = z.object({
  id: z.number().optional(),
  name: z.string(),
  created_at: z.string().optional(),
  paid_by: z.number(),
  total: z.number(),
  currency: z.string(),
  category_id: z.number().optional(),
  shares: z.array(UpsertAccountShareDto),
  is_payment: z.boolean(),
});
export type UpsertExpenseDto = z.infer<typeof UpsertExpenseDto>;

export const useExpenses = <C extends SWRConfiguration>(config?: C) => {
  const result = useData(
    "/api/expense",
    Expense.array(),
    config ?? { suspense: true }
  );
  const api = useApiClient();

  const upsert = async (upsertExpenseDto: UpsertExpenseDto) => {
    const response = await api.fetch(`/api/expense`, {
      method: "PUT",
      body: JSON.stringify(upsertExpenseDto),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const upsertedExpense = Expense.parse(await response.json());

    result.mutate((current = []) => {
      if (upsertExpenseDto.id) {
        const oldExpenseIndex = current.findIndex(
          (expense) => expense.id === upsertExpenseDto.id
        );
        return [
          ...current.slice(0, oldExpenseIndex),
          upsertedExpense,
          ...current.slice(oldExpenseIndex + 1),
        ];
      }
      return [upsertedExpense, ...current];
    });
  };

  const remove = async (expenseId: number) => {
    await api.fetch(`/api/expense/${expenseId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    result.mutate((current = []) => {
      return current.filter((expense) => expense.id !== expenseId);
    });
  };

  return { ...result, upsert, remove };
};

export const useExpense = (id: number | string) => {
  return useData(`/api/expense/${id}`, Expense, { suspense: true });
};
