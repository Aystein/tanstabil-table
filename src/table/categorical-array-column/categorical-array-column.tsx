import type { CellContext } from "@tanstack/react-table";
import type { CellRenderer } from "../features/cell-visualization/types";
import type { JSX } from "react";
import { CategoricalArrayColumnCell } from "./components/categorical-array-cell";
import { CategoricalArrayHeatmapCell } from "./components/categorical-array-heatmap-cell";

export const categoricalArrayCellRenderer: CellRenderer = {
  component: CategoricalArrayColumnCell as (props: CellContext<any, any>) => JSX.Element,
  id: "categorical-array",
  name: "Upset",
};

export const categoricalArrayHeatmapCellRenderer: CellRenderer = {
  component: CategoricalArrayHeatmapCell as (props: CellContext<any, any>) => JSX.Element,
  id: "categorical-array-heatmap",
  name: "Heatmap",
};
