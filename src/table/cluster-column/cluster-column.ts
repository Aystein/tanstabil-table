import { type RowData } from "@tanstack/react-table";
import type { TanstabilColumn, TanstabilTable, TanstabilTable_Internal } from "../table-types";
import type { ClusterFeatureShape } from "./types";
import { createCategoryFeature } from "../category-column/category-column-feature";
import { produce } from "immer";
import { uniq } from "es-toolkit";
import type { ClusterGroup } from "./cluster-column-feature";

/**
 * Creates a lookup table from row id to all clusters its assigned to
 */
export function _clusterLookupTable(clusterGroup: ClusterGroup) {
  const map = new Map<string, string[]>();

  for (const cluster of Object.values(clusterGroup.clustersById)) {
    for (const rowId of cluster.rowIds) {
      map.set(rowId, [...(map.get(rowId) ?? []), cluster.id]);
    }
  }

  return map;
}

function _assignToCluster<TData extends RowData>(
  table: TanstabilTable<TData>,
  column: TanstabilColumn<TData>,
  rowIds: string[],
  id: string,
) {
  if (rowIds.length === 0) {
    return;
  }

  table.setClusters((state) => {
    return produce(state, (draft) => {
      const clusterGroup = draft.clusterGroupsById[column.id];

      if (!clusterGroup) {
        const cluster = {
          id,
          rowIds,
        };

        draft.clusterGroupsById[column.id] = {
          id: column.id,
          clustersById: {
            [cluster.id]: cluster,
          },
        };
      } else {
        const existingCluster = Object.entries(clusterGroup.clustersById).find(
          ([, cluster]) => cluster.id === id,
        );

        if (existingCluster) {
          existingCluster[1].rowIds = uniq([...existingCluster[1].rowIds, ...rowIds]);
        } else {
          const cluster = {
            id,
            rowIds,
          };

          clusterGroup.clustersById[cluster.id] = cluster;
        }
      }
    });
  });
}

export function createClusterFeature<TData extends RowData>(
  table: TanstabilTable_Internal<TData>,
  column: TanstabilColumn<TData>,
): ClusterFeatureShape {
  return {
    ...createCategoryFeature(table, column),
    assignToCluster: (rowIds: string[], label: string) =>
      _assignToCluster(table as unknown as TanstabilTable<TData>, column, rowIds, label),
  };
}
