import type { FilterFn, Row } from "@tanstack/react-table";
import type { VantageFeatures } from "../use-vantage-table";

export type ResolvedCategoricalArrayFilterValue =
  | {
      categories: Set<string | undefined>;
      op: "and" | "or";
    }
  | undefined;

export type CategoricalArrayFilterValue =
  | {
      categories: (string | undefined)[];
      op: "and" | "or";
    }
  | undefined;

export const categoricalArrayFilterFn: FilterFn<VantageFeatures, any> = (
  row: Row<VantageFeatures, any>,
  columnId: string,
  filterValue: ResolvedCategoricalArrayFilterValue,
) => {
  if (filterValue === undefined) {
    return true;
  }

  const { op, categories } = filterValue;
  const value = new Set(row.getValue<string[] | undefined>(columnId) ?? [undefined]);

  if (op === "and") {
    return categories.isSubsetOf(value);
  }

  // Implement filter logic here
  if (op === "or") {
    return categories.intersection(value).size > 0;
  }

  throw new Error("Invalid filter operation");
};

categoricalArrayFilterFn.resolveFilterValue = (value: CategoricalArrayFilterValue) => {
  if (value === undefined) {
    return undefined;
  }

  return {
    categories: new Set(value.categories),
    op: value.op,
  };
};
