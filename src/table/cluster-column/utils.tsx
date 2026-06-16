import type { AccessorFnColumnDef, RowData } from "@tanstack/react-table";
import { Menu } from "@mantine/core";
import type { VantageFeatures } from "../use-vantage-table";
import { isClusterColumn, type ClusterColumnDef } from "./types";
import { createCategoricalArrayColumn } from "../categorical-array-column/util";
import { createClusterFeature } from "./cluster-column";

export function createClusterColumnDef<TData extends RowData>(
  columnDef: AccessorFnColumnDef<VantageFeatures, TData, string[] | undefined>,
): ClusterColumnDef<TData> {
  return {
    ...createCategoricalArrayColumn(columnDef),
    defaultCellVisualization: "categorical-array",
    renderColumnMenuItems: (table, column) => {
      if (!isClusterColumn(column)) {
        return null;
      }

      return (
        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item>Cluster group</Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown>
            <Menu.Item
              onClick={() => {
                const selectionTable = table as typeof table & {
                  getRowSelectionIds: () => string[];
                };

                column.feature().assignToCluster(selectionTable.getRowSelectionIds(), "Test");
              }}
            >
              Assign to
            </Menu.Item>
          </Menu.Sub.Dropdown>
        </Menu.Sub>
      );
    },
    featureFactory: createClusterFeature as ClusterColumnDef<TData>["featureFactory"],
    columnType: "cluster",
  };
}
