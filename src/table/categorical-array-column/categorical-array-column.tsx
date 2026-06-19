import type { CellRenderer } from "../features/cell-visualization/types";
import { CategoricalArrayColumnCell } from "./components/categorical-array-cell";
import { CategoricalArrayHeatmapCell } from "./components/categorical-array-heatmap-cell";

export const categoricalArrayCellRenderer: CellRenderer = {
  component: CategoricalArrayColumnCell,
  id: "categorical-array",
  name: "Upset",
};

export const categoricalArrayHeatmapCellRenderer: CellRenderer = {
  component: CategoricalArrayHeatmapCell,
  id: "categorical-array-heatmap",
  name: "Heatmap",
};
