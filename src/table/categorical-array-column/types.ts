import { z } from "zod";
import type { CategoryFeatureShape } from "../category-column/types";
import type { RowData } from "@tanstack/react-table";
import type { TypedColumnTypes } from "../features/core-feature/types";

export const CellValueSchema = z.array(z.string()).optional();

export type CellValue = z.infer<typeof CellValueSchema>;

export const AggregationValueSchema = z.object({
  totalRows: z.number().int().nonnegative(),
  counts: z.record(z.string(), z.number().int().nonnegative()),
});

export type AggregationValue = z.infer<typeof AggregationValueSchema>;

export type CategoricalArrayFeatureShape = CategoryFeatureShape & {};

type CategoricalArrayColumnTypes<TData extends RowData> = TypedColumnTypes<
  TData,
  "categorical-array",
  CategoricalArrayFeatureShape,
  CellValue
>;

export type CategoricalArrayColumnDef<TData extends RowData> =
  CategoricalArrayColumnTypes<TData>["def"];

export type CategoricalArrayColumn<TData extends RowData> =
  CategoricalArrayColumnTypes<TData>["column"];

export function isCategoricalArrayColumn(column: unknown): column is CategoricalArrayColumn<any> {
  if (typeof column === "object" && column !== null && "columnDef" in column) {
    const columnDef = column.columnDef as unknown;

    if (typeof columnDef === "object" && columnDef !== null && "columnType" in columnDef) {
      return columnDef.columnType === "categorical-array";
    }
  }

  return false;
}

export function assertCategoricalArrayColumn(
  column: unknown,
): asserts column is CategoricalArrayColumn<any> {
  if (!isCategoricalArrayColumn(column)) {
    // throw new Error("Column is not a categorical array column");
  }
}
