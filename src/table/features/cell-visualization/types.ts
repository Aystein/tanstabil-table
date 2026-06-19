import type {
  CellData,
  OnChangeFn,
  RowData,
  TableFeature,
  TableFeatures,
  Updater,
} from "@tanstack/react-table";
import type { TableInstance, TanstabilCellContext, TanstabilColumn } from "@/table/table-types";
import type { ReactNode } from "react";

export type CellVisualizationState = Record<string, string>;
export type SummaryVisualizationState = Record<string, string>;

export interface CellRenderer<TData extends RowData = any> {
  component: (props: TanstabilCellContext<TData, any>) => ReactNode;
  id: string;
  name: string;
}

export type SummaryCellRenderer<TData extends RowData = RowData> = CellRenderer<TData>;

export type FilterProps<TData extends RowData> = {
  table: TableInstance<TData>;
  column: TanstabilColumn<TData>;
  width: number;
  height: number;
};

export interface TableState_CellVisualization {
  cellVisualizations: CellVisualizationState;
  summaryVisualizations: SummaryVisualizationState;
}

export interface ColumnDef_CellVisualization<TData extends RowData> {
  defaultCellVisualization?: string;
  defaultSummaryCellVisualization?: string;
  cellRenderers?: CellRenderer[];
  summaryCellRenderers?: SummaryCellRenderer[];
  enableColumnMenu?: boolean;
  filter?: (props: FilterProps<TData>) => ReactNode;
  headerContainer?: (props: FilterProps<TData>) => ReactNode;
}

export interface Table_CellVisualization {
  setCellVisualization: (updater: Updater<CellVisualizationState>) => void;
  setSummaryVisualization: (updater: Updater<SummaryVisualizationState>) => void;
}

export interface TableOptions_CellVisualization {
  onCellVisualizationChange?: OnChangeFn<CellVisualizationState>;
  onSummaryVisualizationChange?: OnChangeFn<SummaryVisualizationState>;
}

export interface CellVisualizationFeatureConstructors<TData extends RowData = RowData> {
  TableState: TableState_CellVisualization;
  ColumnDef: ColumnDef_CellVisualization<TData>;
  Table: Table_CellVisualization;
  TableOptions: TableOptions_CellVisualization;
}

declare module "@tanstack/react-table" {
  interface Plugins {
    cellVisualizationFeature: TableFeature;
  }

  interface ColumnDef_FeatureMap<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData,
  > {
    cellVisualizationFeature: ColumnDef_CellVisualization<TData>;
  }

  interface TableState_FeatureMap {
    cellVisualizationFeature: TableState_CellVisualization;
  }

  interface TableOptions_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    cellVisualizationFeature: TableOptions_CellVisualization;
  }

  interface Table_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    cellVisualizationFeature: Table_CellVisualization;
  }
}
