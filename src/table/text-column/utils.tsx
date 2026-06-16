import type { ColumnDef, RowData } from "@tanstack/react-table";
import type { TextColumnDef } from "./types";
import type { VantageFeatures } from "../use-vantage-table";
import { Filter } from "./components/filter";
import { filterFn } from "./filter-fn";
import { textCellRenderer } from "../text-cell";

export function createTextColumnDef<TData extends RowData>(
  columnDef: ColumnDef<VantageFeatures, TData>,
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
