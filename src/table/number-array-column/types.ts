import { z } from "zod";
import type { RowData } from "@tanstack/react-table";
import type { TypedColumnTypes } from "../features/core-feature/types";

export const CellValueSchema = z.array(z.number()).optional();

export type CellValue = z.infer<typeof CellValueSchema>;

export const AggregationValueSchema = z.object({
  totalRows: z.number().int().nonnegative(),
  counts: z.record(z.string(), z.number().int().nonnegative()),
});

export type AggregationValue = z.infer<typeof AggregationValueSchema>;

export type NumberArrayFeatureShape = {
  getDomain: () => [number, number] | undefined;
  getColorScale: () => (value: number | undefined) => string;
};

type NumberArrayColumnTypes<TData extends RowData> = TypedColumnTypes<
  TData,
  "number-array",
  NumberArrayFeatureShape,
  CellValue
>;

export type NumberArrayColumnDef<TData extends RowData> = NumberArrayColumnTypes<TData>["def"];

export type NumberArrayColumn<TData extends RowData> = NumberArrayColumnTypes<TData>["column"];

export function isNumberArrayColumn(column: unknown): column is NumberArrayColumn<any> {
  if (typeof column === "object" && column !== null && "columnDef" in column) {
    const columnDef = column.columnDef as unknown;

    if (typeof columnDef === "object" && columnDef !== null && "columnType" in columnDef) {
      return columnDef.columnType === "number-array";
    }
  }

  return false;
}

export function assertIsNumberArrayColumn(
  column: unknown,
): asserts column is NumberArrayColumn<any> {
  if (!isNumberArrayColumn(column)) {
    throw new Error("Column is not a number array column");
  }
}
