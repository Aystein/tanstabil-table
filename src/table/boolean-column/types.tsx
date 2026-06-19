import type { RowData } from "@tanstack/react-table";
import type { FeaturedTypes } from "../features/inheritance/types";

export type BooleanFeatureShape = {};

type BooleanColumnTypes<TData extends RowData> = FeaturedTypes<
  TData,
  "boolean",
  BooleanFeatureShape,
  boolean | undefined
>;

export type BooleanColumnDef<TData extends RowData> = BooleanColumnTypes<TData>["def"];

export type BooleanColumn<TData extends RowData> = BooleanColumnTypes<TData>["column"];

export function isBooleanColumn(column: unknown): column is BooleanColumn<any> {
  return (
    typeof column === "object" &&
    column !== null &&
    "columnDef" in column &&
    typeof (column as { columnDef: unknown }).columnDef === "object" &&
    (column as { columnDef: { columnType: unknown } }).columnDef.columnType === "boolean"
  );
}

export function assertBooleanColumn(column: unknown): asserts column is BooleanColumn<any> {
  if (!isBooleanColumn(column)) {
    throw new Error("Column is not a boolean column");
  }
}
