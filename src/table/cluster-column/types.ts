import type { RowData } from "@tanstack/react-table";
import type { FeaturedColumn, FeaturedColumnDef } from "../features/inheritance/types";
import type { CategoricalArrayFeatureShape } from "../categorical-array-column/types";

export type ClusterFeatureShape = {
  assignToCluster: (rowIds: string[], label: string) => void;
} & CategoricalArrayFeatureShape;

export type ClusterColumnDef<TData extends RowData> = FeaturedColumnDef<
  TData,
  "cluster",
  ClusterFeatureShape,
  string[] | undefined
>;

export interface ClusterColumn<TData extends RowData> extends FeaturedColumn<
  TData,
  ClusterColumnDef<TData>,
  ClusterFeatureShape,
  string[] | undefined
> {}

export function isClusterColumn(column: unknown): column is ClusterColumn<any> {
  if (typeof column === "object" && column !== null && "columnDef" in column) {
    const columnDef = column.columnDef as unknown;

    if (typeof columnDef === "object" && columnDef !== null && "columnType" in columnDef) {
      return columnDef.columnType === "cluster";
    }
  }

  return false;
}
