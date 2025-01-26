import { z } from "zod";
import { useData } from "./useData";

export const UserDto = z.object({
  id: z.number(),
  name: z.string(),
  phone_number: z.string().nullable(),
});
export type UserDto = z.infer<typeof UserDto>;

export const useUsers = () => {
  return useData("/api/user", UserDto.array(), {
    suspense: true,
  });
};
