import type { VantageFeatures } from "@/table/use-vantage-table";
import type {
  CellData,
  CellContext,
  Column,
  ColumnDef,
  ColumnDefTemplate,
  FilterFn,
  RowData,
  TableFeature,
  Table_Internal,
  TableFeatures,
} from "@tanstack/react-table";
import type { Virtualizer } from "@tanstack/react-virtual";
import type { JSX, RefObject } from "react";

export interface CoreColumn<
  TData extends RowData,
  TColumnDef extends ColumnDef<VantageFeatures, TData, TValue> = ColumnDef<
    VantageFeatures,
    TData,
    any
  >,
  TFeature = unknown,
  TValue = unknown,
> extends Column<VantageFeatures, TData, TValue> {
  _feature?: TFeature;
  feature: () => TFeature;

  columnDef: TColumnDef;
}

export type TypedColumnDef<
  TData extends RowData,
  TType extends string,
  TFeature,
  TValue extends CellData = CellData,
> = {
  columnType: TType;
  featureFactory?: (
    table: Table_Internal<VantageFeatures, TData>,
    column: Column<VantageFeatures, TData, TValue>,
  ) => TFeature;
} & ColumnDef<VantageFeatures, TData, TValue>;

export type TypedColumnTypes<
  TData extends RowData,
  TType extends string,
  TFeature,
  TValue extends CellData = CellData,
  TColumnDefExtension extends object = {},
> = {
  def: TypedColumnDef<TData, TType, TFeature, TValue> & TColumnDefExtension;
  column: CoreColumn<
    TData,
    TypedColumnDef<TData, TType, TFeature, TValue> & TColumnDefExtension,
    TFeature,
    TValue
  >;
};

export interface ColumnMenuContext {
  openBinningDialog?: () => void;
}

export interface Column_TypedColumn {
  _feature?: unknown;
  // feature: () => unknown;

  getCoreUniqueValues: () => Map<any, number>;
}

export interface ColumnDef_TypedColumn<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData,
> {
  columnType?: unknown;

  featureFactory?: (
    table: Table_Internal<TFeatures, TData>,
    column: Column<TFeatures, TData, TValue>,
  ) => any;

  globalFilterFn?: FilterFn<TFeatures, RowData>;

  groupedCell?: ColumnDefTemplate<CellContext<TFeatures, TData, TValue>>;

  renderColumnMenuItems?: (
    table: Table_Internal<VantageFeatures, RowData>,
    column: Column<VantageFeatures, RowData>,
    context: ColumnMenuContext,
  ) => JSX.Element | null;

  enableCellPadding?: boolean;
  cellPadding?: number;
}

export interface Table_TypedColumn {
  getRowSelectionIds: () => string[];
}

export interface TableOptions_TypedColumn {
  rowVirtualizerRef: RefObject<Virtualizer<HTMLDivElement, Element>>;
}

declare module "@tanstack/react-table" {
  interface Plugins {
    typedColumnFeature: TableFeature;
  }

  interface Column_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    typedColumnFeature: Column_TypedColumn;
  }

  interface ColumnDef_FeatureMap<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData,
  > {
    typedColumnFeature: ColumnDef_TypedColumn<TFeatures, TData, TValue>;
  }

  interface TableOptions_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    typedColumnFeature: TableOptions_TypedColumn;
  }

  interface Table_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    typedColumnFeature: Table_TypedColumn;
  }
}
