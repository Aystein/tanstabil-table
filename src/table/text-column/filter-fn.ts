export function filterFn(
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: unknown,
) {
  const normalizedFilter = typeof filterValue === "string" ? filterValue.trim().toLowerCase() : "";

  if (!normalizedFilter) {
    return true;
  }

  const value = row.getValue(columnId);
  const normalizedValue =
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value).toLowerCase()
      : "";

  return normalizedValue.includes(normalizedFilter);
}
