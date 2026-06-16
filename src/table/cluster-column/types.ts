import type { RowData } from "@tanstack/react-table";
import type { CoreColumn, TypedColumnDef } from "../features/core-feature/types";
import type { CategoryColumnDef } from "../category-column/types";
import type { CategoricalArrayFeatureShape } from "../categorical-array-column/types";

export type ClusterFeatureShape = {
  assignToCluster: (rowIds: string[], label: string) => void;
} & CategoricalArrayFeatureShape;

export type ClusterColumnDef<TData extends RowData> = TypedColumnDef<
  TData,
  "cluster",
  ClusterFeatureShape,
  string[] | undefined
>;

export interface ClusterColumn<TData extends RowData> extends CoreColumn<
  TData,
  CategoryColumnDef<TData>,
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
