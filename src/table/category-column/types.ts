import type { CoreColumn, TypedColumnDef } from "../features/core-feature/types";
import { z } from "zod";
import type { RowData } from "@tanstack/react-table";

export type CategoryCellValue = string | undefined;

export const FilterValueSchema = z.object({
  categories: z.array(z.string().optional()),
});

export type FilterValue = z.infer<typeof FilterValueSchema>;

type CategoryBase = {
  label: string;
  color: string;
};

export type ValidCategory = {
  value: string;
} & CategoryBase;

export type NullCategory = {
  value: undefined;
} & CategoryBase;

export type Category = ValidCategory | NullCategory;

export type OverrideCategoriesFn = (categories: Category[]) => Category[];

export interface CategoryColumnOptions {
  overrideCategories?: OverrideCategoriesFn;
}

export interface CategoryFeatureShape {
  getCategories: () => Category[];
  getValidCategories: () => ValidCategory[];

  getCategoryValues: () => (string | undefined)[];
  getValidCategoryValues: () => string[];
  getColorScale: () => (value: string | undefined) => string;

  getValueToCategoryMap: () => Map<string | undefined, Category>;
}

export type CategoryColumnDef<TData extends RowData> = TypedColumnDef<
  TData,
  "category",
  CategoryFeatureShape
> &
  CategoryColumnOptions;

export type CategoryColumn<TData extends RowData> = Omit<
  CoreColumn<TData, CategoryColumnDef<TData>, CategoryFeatureShape>,
  "columnDef" | "feature"
> & {
  columnDef: CategoryColumnDef<TData>;
  feature: () => CategoryFeatureShape;
};

export interface CategoryFeatureConstructors {
  Column: {
    feature_category: () => CategoryFeatureShape;
  };
}

export function isCategoryColumn(column: unknown): column is CategoryColumn<any> {
  if (typeof column === "object" && column !== null && "columnDef" in column) {
    const columnDef = column.columnDef as unknown;

    if (typeof columnDef === "object" && columnDef !== null && "columnType" in columnDef) {
      return columnDef.columnType === "category";
    }
  }

  return false;
}

export function assertIsCategoryColumn(column: unknown): asserts column is CategoryColumn<any> {
  if (!isCategoryColumn(column)) {
    throw new Error("Column is not a category column");
  }
}
