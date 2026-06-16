import type { RowData } from "@tanstack/react-table";
import type { TypedColumnTypes } from "../features/core-feature/types";

export type DateFeatureShape = {};

type DateColumnTypes<TData extends RowData> = TypedColumnTypes<
  TData,
  "date",
  DateFeatureShape,
  Date | undefined
>;

export type DateColumnDef<TData extends RowData> = DateColumnTypes<TData>["def"];

export type DateColumn<TData extends RowData> = DateColumnTypes<TData>["column"];

export function isDateColumn(column: unknown): column is DateColumn<any> {
  return (
    typeof column === "object" &&
    column !== null &&
    "columnDef" in column &&
    typeof (column as { columnDef: unknown }).columnDef === "object" &&
    (column as { columnDef: { columnType: unknown } }).columnDef.columnType === "date"
  );
}

export function assertDateColumn(column: unknown): asserts column is DateColumn<any> {
  if (!isDateColumn(column)) {
    throw new Error("Column is not a date column");
  }
}
