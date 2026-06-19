import { memo, type RowData } from "@tanstack/react-table";
import type { NumberArrayColumnDef, NumberArrayFeatureShape } from "./types";
import type {
  TanstabilAccessorFnColumnDef,
  TanstabilColumn,
  TanstabilTable_Internal,
} from "../table-types";
import { interpolateBlues, scaleSequential } from "d3";
import { textCellRenderer } from "../text-cell";
import { numberArrayCellRenderer } from "./number-array-column";

export function createNumberArrayFeature<TData extends RowData>(
  table: TanstabilTable_Internal<TData>,
  column: TanstabilColumn<TData, number[] | undefined>,
): NumberArrayFeatureShape {
  const _getDomain = memo({
    fn: (rowModel) => {
      const { flatRows } = rowModel;
      let min = Infinity;
      let max = -Infinity;

      for (let i = 0; i < flatRows.length; i++) {
        const row = flatRows[i]!;
        const value = row.getValue<number[] | undefined>(column.id) ?? [];

        for (let j = 0; j < value.length; j++) {
          // update domain
          min = Math.min(min, value[j]);
          max = Math.max(max, value[j]);
        }
      }

      return min === Infinity || max === -Infinity
        ? undefined
        : ([min, max] satisfies [number, number]);
    },
    memoDeps: () => [table.getCoreRowModel()],
  });

  return {
    getDomain: _getDomain,
    getColorScale: memo({
      fn: (domain) => {
        if (domain === undefined) {
          return () => "white";
        }

        return scaleSequential(domain, interpolateBlues).unknown("white") as (
          value: number | undefined,
        ) => string;
      },
      memoDeps: () => [_getDomain(table.getCoreRowModel())],
    }),
  };
}

export function createNumberArrayColumn<TData extends RowData>(
  columnDef: TanstabilAccessorFnColumnDef<TData, number[] | undefined>,
): NumberArrayColumnDef<TData> {
  return {
    ...columnDef,
    columnType: "number-array",
    defaultCellVisualization: "number-array",
    cellRenderers: [...(columnDef.cellRenderers ?? []), textCellRenderer, numberArrayCellRenderer],
    featureFactory: createNumberArrayFeature,
    enableGrouping: false,
  };
}
