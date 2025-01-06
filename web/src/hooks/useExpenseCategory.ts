import { z } from "zod";
import { useData } from "./useData";

export const ExpenseCategory = z.object({
  id: z.number(),
  name: z.string(),
});
export type ExpenseCategory = z.infer<typeof ExpenseCategory>;

export const useExpenseCategory = () => {
  return useData("/api/expense_category", ExpenseCategory.array(), {
    suspense: true,
  });
};
