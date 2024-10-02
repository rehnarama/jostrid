import { useLoaderData, useRouteLoaderData } from "react-router";
import { ParseParams, Schema } from "zod";

export function useTypedLoaderData<S extends Schema<any>>(
  schema: S,
  parseParams?: ParseParams
): S extends Schema<infer Output> ? Output : unknown {
  const loaderData = useLoaderData();
  return schema.parse(loaderData, parseParams);
}

export function useTypedRouteLoaderData<S extends Schema<any>>(
  routeId: string,
  schema: S,
  parseParams?: ParseParams
): S extends Schema<infer Output> ? Output : unknown {
  const loaderData = useRouteLoaderData(routeId);
  return schema.parse(loaderData, parseParams);
}
