import type { FilterFn, Row } from "@tanstack/react-table";
import type { VantageFeatures } from "../use-vantage-table";
import type { FilterValue } from "./types";

type ResolvedNumberFilterValue =
  | {
      mode: "brush";
      min: number | undefined;
      max: number | undefined;
    }
  | {
      mode: "bins";
      binIds: Set<string>;
    }
  | undefined;

type BinFilterValue = Extract<FilterValue, { mode: "bins" }>;
type BrushLikeFilterValue =
  | Extract<FilterValue, { mode: "brush" }>
  | { min?: number; max?: number };

function isBinFilterValue(filterValue: FilterValue | undefined): filterValue is BinFilterValue {
  return filterValue !== undefined && "mode" in filterValue && filterValue.mode === "bins";
}

function getBrushRange(filterValue: FilterValue | undefined) {
  if (filterValue === undefined || isBinFilterValue(filterValue)) {
    return undefined;
  }

  const brushValue = filterValue as BrushLikeFilterValue;

  if (brushValue.min === undefined && brushValue.max === undefined) {
    return undefined;
  }

  return {
    min: brushValue.min,
    max: brushValue.max,
  };
}

export const numberFilterFn: FilterFn<VantageFeatures, any> = (
  row: Row<VantageFeatures, any>,
  columnId: string,
  filterValue: ResolvedNumberFilterValue,
) => {
  if (filterValue?.mode === "bins") {
    const binId = row.getGroupingValue(columnId);

    return typeof binId === "string" && filterValue.binIds.has(binId);
  }

  const value = row.getValue(columnId);

  if (typeof value !== "number" || Number.isNaN(value)) {
    return filterValue === undefined;
  }

  if (filterValue?.min !== undefined && value < filterValue.min) {
    return false;
  }

  if (filterValue?.max !== undefined && value > filterValue.max) {
    return false;
  }

  return true;
};

numberFilterFn.resolveFilterValue = (value: FilterValue | undefined) => {
  if (isBinFilterValue(value)) {
    return value.binIds.length === 0 ? undefined : { mode: "bins", binIds: new Set(value.binIds) };
  }

  const range = getBrushRange(value);

  if (range === undefined) {
    return undefined;
  }

  return { mode: "brush", ...range };
};
