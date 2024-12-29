import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { Schema } from "zod";
const { VITE_BACKEND_URL } = import.meta.env;

type SchemaData<S> = S extends Schema<infer Data> ? Data : never;

export const useData = <
  S extends Schema<any>,
  Config extends SWRConfiguration<SchemaData<S>>,
>(
  url: string,
  schema: S,
  config?: Config
): SWRResponse<SchemaData<S>, Error, Config> => {
  return useSWR(
    url,
    async (arg) => {
      const response = await fetch(`${VITE_BACKEND_URL}${arg}`);
      return schema.parse(await response.json());
    },
    config
  );
};
