import type {
  TanstabilColumn,
  TanstabilColumnDef,
  TanstabilTable_Internal,
} from "@/table/table-types";
import type {
  CellData,
  CellContext,
  ColumnDefTemplate,
  FilterFn,
  RowData,
  TableFeature,
  Table_Internal,
  TableFeatures,
} from "@tanstack/react-table";
import type { Virtualizer } from "@tanstack/react-virtual";
import type { JSX, RefObject } from "react";

export type FeaturedColumn<
  TData extends RowData,
  TColumnDef extends TanstabilColumnDef<TData, TValue>,
  TFeature = unknown,
  TValue = unknown,
> = TanstabilColumn<TData, TValue> & {
  _feature?: TFeature;
  feature: () => TFeature;

  columnDef: TColumnDef;
};

export type FeaturedColumnDef<
  TData extends RowData,
  TType extends string,
  TFeature,
  TValue extends CellData = CellData,
> = {
  columnType: TType;
  featureFactory?: (
    table: TanstabilTable_Internal<TData>,
    column: TanstabilColumn<TData, TValue>,
  ) => TFeature;
} & TanstabilColumnDef<TData, TValue>;

export type FeaturedTypes<
  TData extends RowData,
  TType extends string,
  TFeature,
  TValue extends CellData = CellData,
  TColumnDefExtension extends object = {},
> = {
  def: FeaturedColumnDef<TData, TType, TFeature, TValue> & TColumnDefExtension;
  column: FeaturedColumn<
    TData,
    FeaturedColumnDef<TData, TType, TFeature, TValue> & TColumnDefExtension,
    TFeature,
    TValue
  >;
};

export interface ColumnMenuContext {
  openBinningDialog?: () => void;
}

export interface Column_Inheritance {
  _feature?: unknown;
  // This needs to be unknown or TS will create an overload!
  feature: unknown;

  getCoreUniqueValues: () => Map<any, number>;
}

export interface ColumnDef_Inheritance<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData,
> {
  columnType?: unknown;

  featureFactory?: (
    table: Table_Internal<TFeatures, TData>,
    column: TanstabilColumn<TData, TValue>,
  ) => any;

  globalFilterFn?: FilterFn<TFeatures, RowData>;

  groupedCell?: ColumnDefTemplate<CellContext<TFeatures, TData, TValue>>;

  renderColumnMenuItems?: (
    table: TanstabilTable_Internal<RowData>,
    column: TanstabilColumn<TData, TValue>,
    context: ColumnMenuContext,
  ) => JSX.Element | null;

  enableCellPadding?: boolean;
  cellPadding?: number;
}

export interface Table_Inheritance {
  getRowSelectionIds: () => string[];
}

export interface TableOptions_Inheritance {
  rowVirtualizerRef: RefObject<Virtualizer<HTMLDivElement, Element>>;
}

declare module "@tanstack/react-table" {
  interface Plugins {
    inheritanceFeature: TableFeature;
  }

  interface Column_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    inheritanceFeature: Column_Inheritance;
  }

  interface ColumnDef_FeatureMap<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData,
  > {
    inheritanceFeature: ColumnDef_Inheritance<TFeatures, TData, TValue>;
  }

  interface TableOptions_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    inheritanceFeature: TableOptions_Inheritance;
  }

  interface Table_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    inheritanceFeature: Table_Inheritance;
  }
}
