import { z } from "zod";
import { useData } from "./useData";

export const User = z.object({
  id: z.number(),
  name: z.string(),
});
export type User = z.infer<typeof User>;

export const useUsers = () => {
  return useData("/api/user", User.array(), {
    suspense: true,
  });
};
