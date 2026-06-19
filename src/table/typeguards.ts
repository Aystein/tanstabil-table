export function isColumnOfType<T>(column: unknown, type: string): column is T {
  if (typeof column === "object" && column !== null && "columnDef" in column) {
    const columnDef = column.columnDef as unknown;

    if (typeof columnDef === "object" && columnDef !== null && "columnType" in columnDef) {
      return columnDef.columnType === type;
    }
  }

  return false;
}

export function assertColumnOfType<T>(column: unknown, type: string): asserts column is T {
  if (!isColumnOfType(column, type)) {
    throw new Error("Column is not a category column");
  }
}
