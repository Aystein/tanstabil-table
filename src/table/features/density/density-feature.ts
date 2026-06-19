import {
  assignTableAPIs,
  makeStateUpdater,
  type OnChangeFn,
  type RowData,
  type TableFeature,
  type TableFeatures,
  type Updater,
} from "@tanstack/react-table";

export type RowHeightState = number;
export type FilterHeightState = number;
export type CellPaddingState = number;

export interface TableState_Density {
  rowHeight: RowHeightState;
  filterHeight: FilterHeightState;
  cellPadding: CellPaddingState;
}

export interface TableOptions_Density {
  onRowHeightChange?: OnChangeFn<RowHeightState>;
  onFilterHeightChange?: OnChangeFn<FilterHeightState>;
  onCellPaddingChange?: OnChangeFn<CellPaddingState>;
}

export interface Table_Density {
  setRowHeight: (updater: Updater<RowHeightState>) => void;
  setFilterHeight: (updater: Updater<FilterHeightState>) => void;
  setCellPadding: (updater: Updater<CellPaddingState>) => void;
}

declare module "@tanstack/react-table" {
  interface Plugins {
    densityFeature: TableFeature;
  }

  interface TableState_FeatureMap {
    densityFeature: TableState_Density;
  }

  interface TableOptions_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    densityFeature: TableOptions_Density;
  }

  interface Table_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    densityFeature: Table_Density;
  }
}

export function constructRowHeightTableFeature(): TableFeature {
  return {
    getInitialState: (initialState) => {
      return {
        rowHeight: 34,
        filterHeight: 52,
        cellPadding: 8,
        ...initialState, // must come last
      };
    },
    getDefaultTableOptions: (table) => {
      return {
        onRowHeightChange: makeStateUpdater("rowHeight", table),
        onFilterHeightChange: makeStateUpdater("filterHeight", table),
        onCellPaddingChange: makeStateUpdater("cellPadding", table),
      };
    },
    constructTableAPIs: (table) => {
      assignTableAPIs("densityFeature", table, {
        table_setRowHeight: {
          fn: (updater: Updater<RowHeightState>) => table.options.onRowHeightChange?.(updater),
        },
        table_setFilterHeight: {
          fn: (updater: Updater<FilterHeightState>) =>
            table.options.onFilterHeightChange?.(updater),
        },
        table_setCellPadding: {
          fn: (updater: Updater<CellPaddingState>) => table.options.onCellPaddingChange?.(updater),
        },
      });
    },
  };
}

export const rowHeightTableFeature: TableFeature = constructRowHeightTableFeature();
