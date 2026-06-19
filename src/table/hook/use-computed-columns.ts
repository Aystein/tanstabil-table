import type { RowData } from "@tanstack/react-table";
import type { ComputedColumnsState } from "../computed-column/feature";
import { createFormulaEvaluator } from "../computed-column/formula";
import { createComputedNumberColumn } from "../computed-column/util";
import type { NumberColumnDef } from "../number-column/types";
import type { TanstabilColumnDef } from "../table-types";

export function useComputedColumns<TData extends RowData>(
  enhancedCoreColumns: TanstabilColumnDef<TData>[],
  computedColumns: ComputedColumnsState,
): NumberColumnDef<TData>[] {
  const valueAccessors = new Map<string, (row: TData, index: number) => unknown>();

  for (const column of enhancedCoreColumns) {
    const columnId = column.id;
    const accessorColumn = column as typeof column & {
      accessorFn?: (row: TData, index: number) => unknown;
    };

    if (columnId !== undefined && typeof accessorColumn.accessorFn === "function") {
      valueAccessors.set(columnId, accessorColumn.accessorFn);
    }
  }

  const computedNumberColumns = computedColumns
    .map((computedColumn) => {
      try {
        const evaluateFormula = createFormulaEvaluator(computedColumn.formula);

        return createComputedNumberColumn<TData>({
          id: computedColumn.id,
          header: computedColumn.header,
          accessorFn: (row, index) => {
            const values = Object.fromEntries(
              [...valueAccessors].map(([columnId, accessorFn]) => [
                columnId,
                accessorFn(row, index),
              ]),
            );

            return evaluateFormula(values);
          },
          enableGrouping: true,
          size: 120,
        });
      } catch {
        return null;
      }
    })
    .filter((column): column is NumberColumnDef<TData> => column !== null);

  return computedNumberColumns;
}
