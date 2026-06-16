import {
  assignTableAPIs,
  makeStateUpdater,
  type OnChangeFn,
  type RowData,
  type TableFeature,
  type TableFeatures,
  type Updater,
} from "@tanstack/react-table";

function getDefaultState(): ClusterState {
  return {
    clusterGroupsById: {},
  };
}

export type Cluster = {
  id: string;
  rowIds: string[];
};

export type ClusterGroup = {
  id: string;
  clustersById: Record<string, Cluster>;
};

export type ClusterState = {
  clusterGroupsById: Record<string, ClusterGroup>;
};

export interface TableState_Cluster {
  clusters: ClusterState;
}

export interface Table_Cluster {
  setClusters: (updater: Updater<ClusterState>) => void;
}

export interface TableOptions_Cluster {
  onClustersChange?: OnChangeFn<ClusterState>;
}

declare module "@tanstack/react-table" {
  interface Plugins {
    clusterFeature: TableFeature;
  }

  interface TableState_FeatureMap {
    clusterFeature: TableState_Cluster;
  }

  interface TableOptions_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    clusterFeature: TableOptions_Cluster;
  }

  interface Table_FeatureMap<TFeatures extends TableFeatures, TData extends RowData> {
    clusterFeature: Table_Cluster;
  }
}

export function constructClusterFeature(): TableFeature {
  return {
    getInitialState: (initialState) => {
      return {
        clusters: getDefaultState(),
        ...initialState,
      };
    },
    getDefaultTableOptions: (table) => {
      return {
        onClustersChange: makeStateUpdater("clusters", table),
      };
    },
    constructTableAPIs: (table) => {
      assignTableAPIs("clusterFeature", table, {
        table_setClusters: {
          fn: (updater: Updater<ClusterState>) => table.options.onClustersChange?.(updater),
        },
      });
    },
  };
}

export const clusterFeatuer = constructClusterFeature();
