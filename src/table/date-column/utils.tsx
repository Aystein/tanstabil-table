import type { RowData } from "@tanstack/react-table";
import type { TanstabilAccessorFnColumnDef } from "../table-types";
import type { DateColumnDef } from "./types";
import { dateCellRenderer, defaultDateFormatter } from "./date-cell";

function getDateTime(value: Date | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const time = value.getTime();

  return Number.isNaN(time) ? undefined : time;
}

export function createDateColumnDef<TData extends RowData>(
  base: TanstabilAccessorFnColumnDef<TData, Date | undefined>,
): DateColumnDef<TData> {
  return {
    ...base,
    columnType: "date",
    defaultCellVisualization: "date",
    cellRenderers: [...(base.cellRenderers ?? []), dateCellRenderer],
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue<Date | undefined>(columnId);

      if (value === undefined) {
        return false;
      }

      const searchValue = defaultDateFormatter.format(value);

      return searchValue.includes(filterValue);
    },
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
