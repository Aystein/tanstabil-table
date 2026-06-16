import {
  assignPrototypeAPIs,
  assignTableAPIs,
  type FilterFn,
  type Column,
  type RowData,
  type RowModel,
  type TableFeature,
  type TableFeatures,
} from "@tanstack/react-table";
import type { VantageFeatures } from "@/table/use-vantage-table";

function getCoreUniqueValues<TFeatures extends TableFeatures, TData extends RowData>(
  rowModel: RowModel<TFeatures, TData>,
  columnId: string,
): Map<any, number> {
  const counts = new Map<any, number>();
  const { flatRows } = rowModel;

  for (let i = 0; i < flatRows.length; i++) {
    const row = flatRows[i]!;

    if (!("getUniqueValues" in row)) {
      // Its a grouped row or something else
      continue;
    }

    const values = row.getUniqueValues(columnId);

    for (let j = 0; j < values.length; j++) {
      const value = values[j];

      if (counts.has(value)) {
        counts.set(value, counts.get(value)! + 1);
      } else {
        counts.set(value, 1);
      }
    }
  }

  return counts;
}

export const globalFilterFn: FilterFn<VantageFeatures, RowData> = (row, columnId, filterValue) => {
  const column = row.getAllCellsByColumnId()[columnId]?.column;
  const columnGlobalFilterFn = column?.columnDef.globalFilterFn;

  if (columnGlobalFilterFn !== undefined) {
    return columnGlobalFilterFn(row, columnId, filterValue);
  }

  const value = row.getValue(columnId);

  if (typeof value !== "string" && typeof value !== "number") {
    return false;
  }

  return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
};

globalFilterFn.autoRemove = (value) => !value;

export function constructCoreFeature(): TableFeature {
  return {
    assignColumnPrototype: (prototype, table) => {
      assignPrototypeAPIs("typedColumnFeature", prototype, table, {
        column_feature: {
          fn: (column: Column<TableFeatures, RowData>) =>
            column.columnDef.featureFactory?.(table, column),
          memoDeps: () => ["feature"],
        },
        column_getCoreUniqueValues: {
          fn: (column: Column<TableFeatures, RowData>) =>
            getCoreUniqueValues(table.getCoreRowModel(), column.id),
          memoDeps: () => [table.getCoreRowModel()],
        },
      });
    },
    constructTableAPIs: (table) => {
      assignTableAPIs("typedColumnFeature", table, {
        table_getRowSelectionIds: {
          fn: () => {
            const rowSelection = table.atoms.rowSelection?.get() ?? {};
            return Object.keys(rowSelection).filter((id) => rowSelection[id]);
          },
        },
      });
    },
  };
}

export const typedColumnFeature = constructCoreFeature();
