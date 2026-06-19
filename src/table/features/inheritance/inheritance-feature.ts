import {
  assignPrototypeAPIs,
  assignTableAPIs,
  type RowData,
  type RowModel,
  type TableFeature,
  type TableFeatures,
} from "@tanstack/react-table";
import type {
  TanstabilColumn,
  TanstabilFilterFn,
  TanstabilTable_Internal,
} from "@/table/table-types";

function getCoreUniqueValues<TFeatures extends TableFeatures, TData extends RowData>(
  rowModel: RowModel<TFeatures, TData>,
  columnId: string,
): Map<any, number> {
  const counts = new Map<any, number>();
  const { flatRows } = rowModel;

  for (let i = 0; i < flatRows.length; i++) {
    const row = flatRows[i]!;

    if (!("getUniqueValues" in row)) {
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

export const globalFilterFn: TanstabilFilterFn<RowData> = (row, columnId, filterValue) => {
  const t0 = performance.now();
  const column = row.table.getColumn(columnId);
  const columnGlobalFilterFn = column?.columnDef.globalFilterFn;

  if (columnGlobalFilterFn !== undefined) {
    const result = columnGlobalFilterFn(row, columnId, filterValue);
    const t1 = performance.now();
    console.log(t1 - t0, columnId);
    return result;
  }

  const value = row.getValue(columnId);

  if (typeof value !== "string" && typeof value !== "number") {
    return false;
  }

  return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
};

globalFilterFn.autoRemove = (value) => !value;

export function constructInheritanceFeature(): TableFeature {
  return {
    assignColumnPrototype: (prototype, table) => {
      assignPrototypeAPIs("inheritanceFeature", prototype, table, {
        column_feature: {
          fn: (column: TanstabilColumn<RowData>) =>
            column.columnDef.featureFactory?.(
              table as unknown as TanstabilTable_Internal<RowData>,
              column,
            ),
          memoDeps: () => ["feature"],
        },
        column_getCoreUniqueValues: {
          fn: (column: TanstabilColumn<RowData>) =>
            getCoreUniqueValues(table.getCoreRowModel(), column.id),
          memoDeps: () => [table.getCoreRowModel()],
        },
      });
    },
    constructTableAPIs: (table) => {
      assignTableAPIs("inheritanceFeature", table, {
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

export const inheritanceFeature = constructInheritanceFeature();
