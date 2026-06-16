import type {
  Cell,
  CellContext,
  CellData,
  ColumnDef,
  Header,
  ReactTable,
  Row,
  RowData,
} from "@tanstack/react-table";
import type { VantageFeatures } from "./use-vantage-table";
import type { Virtualizer } from "@tanstack/react-virtual";

export const headerTextHeight = 40;
export const filterHeight = 52;
export const borderWidth = 1;
export const detailRowHeight = 100;

export type TableInstance<T extends RowData> = ReactTable<VantageFeatures, T>;
export type TableCell<TData extends RowData> = Cell<VantageFeatures, TData>;
export type TableHeader<TData extends RowData> = Header<VantageFeatures, TData>;
export type TableRow<TData extends RowData> = Row<VantageFeatures, TData>;
export type PanePosition = "left" | "center" | "right";
export type TableViewMode = "table" | "overview" | "grid";
export type OverviewRowHeight = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type TableVirtualizer = Virtualizer<HTMLDivElement, Element>;

export type VantageCellContext<TData extends RowData, TValue extends CellData> = CellContext<
  VantageFeatures,
  TData,
  TValue
>;

export type VantageColumnDef<TData extends RowData> = ColumnDef<VantageFeatures, TData>;
