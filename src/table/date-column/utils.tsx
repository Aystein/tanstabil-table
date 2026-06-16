import type { RowData } from "@tanstack/react-table";
import type { VantageColumnDef } from "../table-types";
import type { DateColumnDef } from "./types";
import { dateCellRenderer } from "./date-cell";

function getDateTime(value: Date | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const time = value.getTime();

  return Number.isNaN(time) ? undefined : time;
}

export function createDateColumnDef<TData extends RowData>(
  base: VantageColumnDef<TData>,
): DateColumnDef<TData> {
  return {
    ...base,
    columnType: "date",
    defaultCellVisualization: "date",
    cellRenderers: [...(base.cellRenderers ?? []), dateCellRenderer],
    sortFn: (rowA, rowB, columnId) => {
      const timeA = getDateTime(rowA.getValue<Date | undefined>(columnId));
      const timeB = getDateTime(rowB.getValue<Date | undefined>(columnId));

      if (timeA === undefined && timeB === undefined) {
        return 0;
      }

      if (timeA === undefined) {
        return 1;
      }

      if (timeB === undefined) {
        return -1;
      }

      return timeA - timeB;
    },
  };
}
