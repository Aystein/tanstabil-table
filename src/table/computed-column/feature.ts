import {
  assignTableAPIs,
  makeStateUpdater,
  type OnChangeFn,
  type RowData,
  type TableFeature,
  type TableFeatures,
  type Updater,
} from "@tanstack/react-table";

export type ComputedColumnDefinition = {
  id: string;
  header: string;
  formula: string;
};

export type ComputedColumnsState = ComputedColumnDefinition[];

export interface TableState_ComputedColumn {
  computedColumns: ComputedColumnsState;
}

export interface TableOptions_ComputedColumn {
  onComputedColumnsChange?: OnChangeFn<ComputedColumnsState>;
}

export interface Table_ComputedColumn {
  setComputedColumns: (updater: Updater<ComputedColumnsState>) => void;
}

declare module "@tanstack/react-table" {
  interface Plugins {
    computedColumnFeature: TableFeature;
  }

  interface TableState_FeatureMap {
    computedColumnFeature: TableState_ComputedColumn;
  }

  interface TableOptions_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    computedColumnFeature: TableOptions_ComputedColumn;
  }

  interface Table_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    computedColumnFeature: Table_ComputedColumn;
  }
}

export function constructComputedColumnFeature(): TableFeature {
  return {
    getInitialState: (initialState) => {
      return {
        computedColumns: [],
        ...initialState,
      };
    },
    getDefaultTableOptions: (table) => {
      return {
        onComputedColumnsChange: makeStateUpdater("computedColumns", table),
      };
    },
    constructTableAPIs: (table) => {
      assignTableAPIs("computedColumnFeature", table, {
        table_setComputedColumns: {
          fn: (updater: Updater<ComputedColumnsState>) =>
            table.options.onComputedColumnsChange?.(updater),
        },
      });
    },
  };
}

export const computedColumnFeature: TableFeature = constructComputedColumnFeature();
