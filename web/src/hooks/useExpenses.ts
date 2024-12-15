import { z } from "zod";
import { useData } from "./useData";

export const PaidBy = z.object({
  id: z.number(),
  name: z.string(),
});
export type PaidBy = z.infer<typeof PaidBy>;

export const Share = z.object({
  expense_id: z.number(),
  user_id: z.number(),
  share: z.number(),
});
export type Share = z.infer<typeof Share>;

export const Expense = z.object({
  id: z.number(),
  name: z.string(),
  currency: z.string(),
  created_at: z.string(),
  paid_by: PaidBy,
  category: z.any(),
  shares: z.array(Share),
});
export type Expense = z.infer<typeof Expense>;

export const useExpenses = () => {
  return useData("/api/expense", Expense.array(), { suspense: true });
};

export const useExpense = (id: number | string) => {
  return useData(`/api/expense/${id}`, Expense);
};
