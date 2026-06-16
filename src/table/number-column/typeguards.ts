import type { NumberColumn } from "./types";

export function isNumberColumn(column: unknown): column is NumberColumn<any> {
  if (typeof column === "object" && column !== null && "columnDef" in column) {
    const columnDef = column.columnDef as unknown;

    if (typeof columnDef === "object" && columnDef !== null && "columnType" in columnDef) {
      return columnDef.columnType === "number";
    }
  }

  return false;
}

export function assertIsNumberColumn(column: unknown): asserts column is NumberColumn<any> {
  if (!isNumberColumn(column)) {
    throw new Error("Column is not a number column");
  }
}
