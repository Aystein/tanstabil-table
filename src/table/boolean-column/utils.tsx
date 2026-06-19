import type { RowData } from "@tanstack/react-table";
import type { BooleanColumnDef } from "./types";
import type { TanstabilAccessorColumnDef, TanstabilFilterFn } from "../table-types";
import { booleanCellRenderer } from "./boolean-cell";

const booleanGlobalFilterFn: TanstabilFilterFn<RowData> = (row, columnId, filterValue) => {
  const value = row.getValue<boolean | undefined>(columnId);
  const normalizedFilter = String(filterValue).trim().toLowerCase();

  if (normalizedFilter === "" || typeof value !== "boolean") {
    return false;
  }

  const searchableValues = value ? ["yes", "true", "1"] : ["no", "false", "0"];

  return searchableValues.some((searchableValue) => searchableValue.includes(normalizedFilter));
};

export function createBooleanColumnDef<TData extends RowData>(
  base: TanstabilAccessorColumnDef<TData, boolean | undefined>,
): BooleanColumnDef<TData> {
  return {
    ...base,
    columnType: "boolean",
    defaultCellVisualization: "boolean",
    cellRenderers: [...(base.cellRenderers ?? []), booleanCellRenderer],
    globalFilterFn: booleanGlobalFilterFn,
  };
}
