import { z } from "zod";
import { useData } from "./useData";
import { SWRConfiguration } from "swr";

export const Me = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
});
export type Me = z.infer<typeof Me>;

export const useMe = <Config extends SWRConfiguration>(config?: Config) => {
  return useData("/api/me", Me, config);
};
