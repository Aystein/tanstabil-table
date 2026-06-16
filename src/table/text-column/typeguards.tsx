import type { TextColumn } from "./types";

export function isTextColumn(column: unknown): column is TextColumn<any> {
  if (typeof column === "object" && column !== null && "columnDef" in column) {
    const columnDef = (column as { columnDef: unknown }).columnDef;

    if (typeof columnDef === "object" && columnDef !== null && "columnType" in columnDef) {
      return (columnDef as { columnType: unknown }).columnType === "text";
    }
  }

  return false;
}
