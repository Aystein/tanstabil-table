import type { CellRenderer } from "@/table/features/cell-visualization/types";
import { CategoryCell } from "./category-cell";

export const categoryCellRenderer: CellRenderer = {
  component: CategoryCell,
  id: "category",
  name: "Category",
};
