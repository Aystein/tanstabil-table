import {
  assignTableAPIs,
  makeStateUpdater,
  type OnChangeFn,
  type RowData,
  type TableFeature,
  type TableFeatures,
  type Updater,
} from "@tanstack/react-table";
import type { NumberColumnBinning } from "./types";

export type NumberColumnBinsState = Record<string, NumberColumnBinning>;

export interface TableState_NumberColumn {
  bins: NumberColumnBinsState;
}

export interface TableOptions_NumberColumn {
  onBinsChange?: OnChangeFn<NumberColumnBinsState>;
}

export interface Table_NumberColumn {
  setBins: (updater: Updater<NumberColumnBinsState>) => void;
}

declare module "@tanstack/react-table" {
  interface Plugins {
    numberColumnFeature: TableFeature;
  }

  interface TableState_FeatureMap {
    numberColumnFeature: TableState_NumberColumn;
  }

  interface TableOptions_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    numberColumnFeature: TableOptions_NumberColumn;
  }

  interface Table_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    numberColumnFeature: Table_NumberColumn;
  }
}

export function constructNumberColumnFeature(): TableFeature {
  return {
    getInitialState: (initialState) => {
      return {
        bins: {},
        ...initialState,
      };
    },
    getDefaultTableOptions: (table) => {
      return {
        onBinsChange: makeStateUpdater("bins", table),
      };
    },
    constructTableAPIs: (table) => {
      assignTableAPIs("numberColumnFeature", table, {
        table_setBins: {
          fn: (updater: Updater<NumberColumnBinsState>) => table.options.onBinsChange?.(updater),
        },
      });
    },
  };
}

export const numberColumnFeature: TableFeature = constructNumberColumnFeature();
