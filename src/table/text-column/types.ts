import type { FeaturedColumn, FeaturedColumnDef } from "../features/inheritance/types";
import type { RowData } from "@tanstack/react-table";

export type CellValue = string | undefined;

export type TextColumnDef<TData extends RowData> = FeaturedColumnDef<TData, "text", CellValue>;

export interface TextColumn<TData extends RowData> extends FeaturedColumn<
  TData,
  TextColumnDef<TData>
> {}

export interface TextFeatureConstructors {}
