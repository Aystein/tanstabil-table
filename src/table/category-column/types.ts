import type { FeaturedColumn, FeaturedColumnDef } from "../features/inheritance/types";
import { z } from "zod";
import type { RowData } from "@tanstack/react-table";
import { assertColumnOfType, isColumnOfType } from "../typeguards";

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

  getCategoryValues: () => CategoryCellValue[];
  getValidCategoryValues: () => string[];
  getColorScale: () => (value: CategoryCellValue) => string;

  getValueToCategoryMap: () => Map<CategoryCellValue, Category>;
}

export type CategoryColumnDef<TData extends RowData> = FeaturedColumnDef<
  TData,
  "category",
  CategoryFeatureShape
> &
  CategoryColumnOptions;

export type CategoryColumn<TData extends RowData> = FeaturedColumn<
  TData,
  CategoryColumnDef<TData>,
  CategoryFeatureShape
>;

export function isCategoryColumn(column: unknown): column is CategoryColumn<any> {
  return isColumnOfType(column, "category");
}

export function assertIsCategoryColumn(column: unknown): asserts column is CategoryColumn<any> {
  assertColumnOfType(column, "category");
}
