import type { RowData } from "@tanstack/react-table";
import type { TanstabilAccessorFnColumnDef } from "../table-types";
import {
  NumberColumnAggregatedCell,
  numberSummaryCellRenderer,
} from "./components/number-column-aggregated-cell";
import { numberHistogramSummaryCellRenderer } from "./components/number-column-histogram-summary-cell";
import { calculateBoxPlotStats } from "./boxplot";
import { NumberFilter } from "./components/number-filter";
import { type CellValue, type NumberColumnDef } from "./types";
import { createNumberFeature } from "./number-column-def";
import { Menu } from "@mantine/core";
import { textCellRenderer, textSummaryCellRenderer } from "../text-cell";
import { numberCellRenderer } from "./components/number-cell";
import { numberFilterFn } from "./filter-fn";

export function createNumberColumn<TData extends RowData>(
  columnDef: TanstabilAccessorFnColumnDef<TData, number | undefined>,
): NumberColumnDef<TData> {
  return {
    ...columnDef,
    size: 200,
    aggregatedCell: NumberColumnAggregatedCell,
    filterFn: numberFilterFn,
    filter: ({ column, height, table, width }) => {
      return <NumberFilter column={column} table={table} width={width} height={height} />;
    },
    sortFn: (rowA, rowB, columnId) => {
      if (rowA.getIsGrouped() && rowB.getIsGrouped()) {
        const valueA = rowA.getGroupingValue(columnId) as string;
        const valueB = rowB.getGroupingValue(columnId) as string;

        // Split number - number syntax and sort by first number
        const [firstNumberA, secondNumberA] = valueA.split("-");
        const [firstNumberB, secondNumberB] = valueB.split("-");

        return (
          Number(firstNumberA) - Number(firstNumberB) ||
          Number(secondNumberA) - Number(secondNumberB)
        );
      }

      const valueA = rowA.getValue<CellValue>(columnId);
      const valueB = rowB.getValue<CellValue>(columnId);

      if (typeof valueA === "number" && typeof valueB === "number") {
        return valueA - valueB;
      }

      return 0;
    },
    aggregationFn: (columnId, leafRows) => {
      const values = leafRows.map((row) => row.getValue<CellValue>(columnId));

      const stats = calculateBoxPlotStats(values);

      if (stats === undefined) {
        return undefined;
      }

      return stats;
    },
    defaultCellVisualization: "number",
    defaultSummaryCellVisualization: "number-summary",
    cellRenderers: [...(columnDef.cellRenderers ?? []), textCellRenderer, numberCellRenderer],
    summaryCellRenderers: [
      ...(columnDef.summaryCellRenderers ?? []),
      textSummaryCellRenderer,
      numberSummaryCellRenderer,
      numberHistogramSummaryCellRenderer,
    ],
    enableGrouping: true,
    renderColumnMenuItems: (_table, _column, context) => {
      return <Menu.Item onClick={context.openBinningDialog}>Binning</Menu.Item>;
    },
    enableCellPadding: false,
    featureFactory: createNumberFeature as NumberColumnDef<TData>["featureFactory"],
    columnType: "number",
  };
}
