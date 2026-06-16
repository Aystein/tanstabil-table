import {
  assignTableAPIs,
  flexRender,
  makeStateUpdater,
  type CellContext,
  type RowData,
  type TableFeature,
  type Updater,
} from "@tanstack/react-table";
import { getDefaultCellVisualizationState, getDefaultSummaryVisualizationState } from "./utils";
import type { VantageFeatures } from "../../use-vantage-table";
import type { CellVisualizationState, SummaryVisualizationState } from "./types";

export function constructCellVisualizationTableFeature<TData extends RowData>(): TableFeature {
  return {
    getInitialState: (initialState) => {
      return {
        cellVisualizations: getDefaultCellVisualizationState(),
        summaryVisualizations: getDefaultSummaryVisualizationState(),
        ...initialState,
      };
    },
    getDefaultTableOptions: (table) => {
      return {
        onCellVisualizationChange: makeStateUpdater("cellVisualizations", table),
        onSummaryVisualizationChange: makeStateUpdater("summaryVisualizations", table),
      };
    },
    getDefaultColumnDef: () => {
      return {
        cell: (_props) => {
          // @TODO: Is there even a way to correctly type this?
          const props = _props as unknown as CellContext<VantageFeatures, TData>;

          const cellVisualizations = props.table.atoms.cellVisualizations.get();
          const columnDef = props.column.columnDef;
          const defaultCellVisualization = columnDef.defaultCellVisualization;
          const selectedVisualization =
            cellVisualizations[props.column.id] ?? defaultCellVisualization;

          const renderer = columnDef.cellRenderers?.find(
            (renderer) => renderer.id === selectedVisualization,
          );

          if (!renderer) {
            return null;
          }

          return flexRender(renderer.component, props);
        },
        defaultCellVisualization: "text",
      };
    },
    constructTableAPIs: (table) => {
      assignTableAPIs("cellVisualizationFeature", table, {
        table_setCellVisualization: {
          fn: (updater: Updater<CellVisualizationState>) =>
            table.options.onCellVisualizationChange?.(updater),
        },
        table_setSummaryVisualization: {
          fn: (updater: Updater<SummaryVisualizationState>) =>
            table.options.onSummaryVisualizationChange?.(updater),
        },
      });
    },
  };
}

export const cellVisualizationTableFeature = constructCellVisualizationTableFeature();
