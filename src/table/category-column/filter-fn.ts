import type { TanstabilFilterFn, TanstabilRow } from "../table-types";

export type ResolvedCategoryFilterValue =
  | {
      categories: Set<unknown>;
    }
  | undefined;

export type CategoryFilterValue =
  | {
      categories: unknown[];
    }
  | undefined;

export const categoryFilterFn: TanstabilFilterFn<any> = (
  row: TanstabilRow<any>,
  columnId: string,
  filterValue: ResolvedCategoryFilterValue,
) => {
  if (filterValue === undefined || filterValue.categories.size === 0) {
    return true;
  }

  return filterValue.categories.has(row.getValue(columnId));
};

categoryFilterFn.resolveFilterValue = (value: CategoryFilterValue) => {
  if (value === undefined || value.categories.length === 0) {
    return undefined;
  }

  return {
    categories: new Set(value.categories),
  };
};
