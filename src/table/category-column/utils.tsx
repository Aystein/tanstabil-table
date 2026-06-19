import type { RowData } from "@tanstack/react-table";
import { createCategoryFeature } from "./category-column-feature";
import type { CategoryColumnDef, CategoryColumnOptions } from "./types";
import { CategoryFilter } from "./components/category-filter";
import { categoryFilterFn } from "./filter-fn";
import type { TanstabilColumnDef } from "../table-types";
import { categoryCellRenderer } from "./components/category-cell";
import { categoryBadgeCellRenderer } from "./components/category-badge-cell";

export function createCategoryColumnDef<TData extends RowData>(
  columnDef: TanstabilColumnDef<TData> & CategoryColumnOptions,
): CategoryColumnDef<TData> {
  return {
    ...columnDef,
    filter: CategoryFilter,
    filterFn: categoryFilterFn,
    defaultCellVisualization: "category",
    cellRenderers: [
      ...(columnDef.cellRenderers ?? []),
      categoryCellRenderer,
      categoryBadgeCellRenderer,
    ],
    featureFactory: createCategoryFeature,
    columnType: "category",
  };
}
