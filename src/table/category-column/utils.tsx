import type { ColumnDef, RowData } from "@tanstack/react-table";
import { createCategoryFeature } from "./category-column-feature";
import type { CategoryColumnDef, CategoryColumnOptions } from "./types";
import type { VantageFeatures } from "../use-vantage-table";
import { CategoryFilter } from "./components/category-filter";
import { categoryCellRenderer } from "./components/category-cell-renderer";
import { categoryFilterFn } from "./filter-fn";

export function createCategoryColumnDef<TData extends RowData>(
  columnDef: ColumnDef<VantageFeatures, TData> & CategoryColumnOptions,
): CategoryColumnDef<TData> {
  return {
    ...columnDef,
    filter: CategoryFilter,
    filterFn: categoryFilterFn,
    defaultCellVisualization: "category",
    cellRenderers: [...(columnDef.cellRenderers ?? []), categoryCellRenderer],
    featureFactory: createCategoryFeature,
    columnType: "category",
    enableCellPadding: false,
  };
}
