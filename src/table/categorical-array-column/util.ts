import type { RowData } from "@tanstack/react-table";
import type {
  TanstabilAccessorFnColumnDef,
  TanstabilColumn,
  TanstabilTable_Internal,
} from "../table-types";
import type {
  AggregationValue,
  CategoricalArrayColumnDef,
  CategoricalArrayFeatureShape,
} from "./types";
import { createCategoryFeature } from "../category-column/category-column-feature";
import { categoricalArrayFilterFn } from "./filter-fn";
import { CategoricalArrayFilter } from "./components/categorical-array-filter";
import {
  CategoricalArrayColumnAggregatedCell,
  categoricalArraySummaryCellRenderer,
} from "./components/categorical-array-aggregated-cell";
import { textCellRenderer, textSummaryCellRenderer } from "../text-cell";
import {
  categoricalArrayCellRenderer,
  categoricalArrayHeatmapCellRenderer,
} from "./categorical-array-column";

function normalizeCellValue(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((entry): entry is string => typeof entry === "string"))];
}

function createCategoricalArrayFeature<TData extends RowData>(
  table: TanstabilTable_Internal<TData>,
  column: TanstabilColumn<TData, string[] | undefined>,
): CategoricalArrayFeatureShape {
  return {
    ...createCategoryFeature(table, column),
  };
}

export function createCategoricalArrayColumn<TData extends RowData>(
  columnDef: TanstabilAccessorFnColumnDef<TData, string[] | undefined>,
): CategoricalArrayColumnDef<TData> {
  const { accessorFn } = columnDef;

  return {
    ...columnDef,
    aggregatedCell: CategoricalArrayColumnAggregatedCell,
    getUniqueValues: (row, index) => {
      return accessorFn(row, index) ?? [undefined];
    },
    aggregationFn: (columnId, leafRows) => {
      const counts = new Map<string, number>();

      for (const row of leafRows) {
        for (const category of normalizeCellValue(row.getValue(columnId))) {
          counts.set(category, (counts.get(category) ?? 0) + 1);
        }
      }

      return {
        totalRows: leafRows.length,
        counts: Object.fromEntries(counts),
      } satisfies AggregationValue;
    },
    columnType: "categorical-array",
    defaultCellVisualization: "categorical-array",
    defaultSummaryCellVisualization: "categorical-array-summary",
    cellRenderers: [
      ...(columnDef.cellRenderers ?? []),
      textCellRenderer,
      categoricalArrayCellRenderer,
      categoricalArrayHeatmapCellRenderer,
    ],
    summaryCellRenderers: [
      ...(columnDef.summaryCellRenderers ?? []),
      textSummaryCellRenderer,
      categoricalArraySummaryCellRenderer,
    ],
    featureFactory: createCategoricalArrayFeature,
    filterFn: categoricalArrayFilterFn,
    filter: CategoricalArrayFilter,
    enableGrouping: false,
  };
}
