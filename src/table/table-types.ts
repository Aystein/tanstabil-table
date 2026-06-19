import type {
  Cell,
  CellContext,
  CellData,
  Column,
  AccessorColumnDef,
  AccessorFnColumnDef,
  ColumnDef,
  FilterFn,
  Header,
  ReactTable,
  Row,
  RowData,
  Table,
  TableOptions,
  Table_Internal,
  TableFeatures,
} from "@tanstack/react-table";
import type { Virtualizer } from "@tanstack/react-virtual";

export const headerTextHeight = 40;
export const filterHeight = 52;
export const borderWidth = 1;
export const detailRowHeight = 100;

// @clean
export type TableInstance<T extends RowData> = ReactTable<TableFeatures, T>;
// @clean
export type TableCell<TData extends RowData> = Cell<TableFeatures, TData>;
// @clean
export type TableHeader<TData extends RowData> = Header<TableFeatures, TData>;
// @clean
export type TableRow<TData extends RowData> = Row<TableFeatures, TData>;
export type PanePosition = "left" | "center" | "right";
export type TableViewMode = "table" | "overview" | "grid";
export type OverviewRowHeight = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type TableVirtualizer = Virtualizer<HTMLDivElement, Element>;

// @clean
export type TanstabilCellContext<
  TData extends RowData,
  TValue extends CellData = CellData,
> = CellContext<TableFeatures, TData, TValue>;

// @clean
export type TanstabilAccessorFnColumnDef<
  TData extends RowData,
  TValue extends CellData = CellData,
> = AccessorFnColumnDef<TableFeatures, TData, TValue>;

// @clean
export type TanstabilAccessorColumnDef<
  TData extends RowData,
  TValue extends CellData = CellData,
> = AccessorColumnDef<TableFeatures, TData, TValue>;

// @clean
export type TanstabilColumnDef<
  TData extends RowData,
  TValue extends CellData = CellData,
> = ColumnDef<TableFeatures, TData, TValue>;

// @clean
export type TanstabilColumn<TData extends RowData, TValue = unknown> = Column<
  TableFeatures,
  TData,
  TValue
>;

// @clean
export type TanstabilRow<TData extends RowData> = Row<TableFeatures, TData>;

// @clean
export type TanstabilTable<TData extends RowData> = Table<TableFeatures, TData>;

// @clean
export type TanstabilTableOptions<TData extends RowData> = TableOptions<TableFeatures, TData>;

// @clean
export type TanstabilTable_Internal<TData extends RowData> = Table_Internal<TableFeatures, TData>;

// @clean
export type TanstabilFilterFn<TData extends RowData = RowData> = FilterFn<TableFeatures, TData>;
