import type { CoreColumn, TypedColumnDef } from "../features/core-feature/types";
import type { RowData } from "@tanstack/react-table";

export type CellValue = string | undefined;

export type TextColumnDef<TData extends RowData> = TypedColumnDef<TData, "text", CellValue>;

export interface TextColumn<TData extends RowData> extends CoreColumn<
  TData,
  TextColumnDef<TData>
> {}

export interface TextFeatureConstructors {}
