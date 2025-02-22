import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { Schema } from "zod";
import { useApiClient } from "./useApiClient";

type SchemaData<S> = S extends Schema<infer Data> ? Data : never;

export const useData = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  S extends Schema<any>,
  Config extends SWRConfiguration<SchemaData<S>>,
>(
  url: string,
  schema: S,
  config?: Config,
): SWRResponse<SchemaData<S>, Error, Config> => {
  const api = useApiClient();
  return useSWR<SchemaData<S>>(
    url,
    async (arg) => {
      const response = await api.fetch(`${arg}`);
      return schema.parse(await response.json());
    },
    config,
  );
};
