import type { RowData } from "@tanstack/react-table";
import type { TextColumnDef } from "./types";
import { Filter } from "./components/filter";
import { filterFn } from "./filter-fn";
import { textCellRenderer } from "../text-cell";
import type { TanstabilColumnDef } from "../table-types";

export function createTextColumnDef<TData extends RowData>(
  columnDef: TanstabilColumnDef<TData>,
): TextColumnDef<TData> {
  return {
    ...columnDef,
    filter: Filter,
    filterFn,
    defaultCellVisualization: "text",
    cellRenderers: [...(columnDef.cellRenderers ?? []), textCellRenderer],
    columnType: "text",
  };
}
