import type { CellRenderer } from "@/table/features/cell-visualization/types";
import type { TanstabilCellContext } from "@/table/table-types";
import { rgba } from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import { assertIsCategoryColumn } from "../types";

export function CategoryBadgeCell({
  getValue,
  column,
}: TanstabilCellContext<RowData, string | undefined>) {
  assertIsCategoryColumn(column);

  const feature = column.feature();
  const value = getValue();
  const category = feature.getValueToCategoryMap().get(value);

  if (category === undefined) {
    return null;
  }

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        minWidth: 0,
        width: "100%",
      }}
    >
      <span
        style={{
          alignItems: "center",
          backgroundColor: rgba(category.color, 0.1),
          border: `1px solid ${rgba(category.color, 0.35)}`,
          borderRadius: 999,
          boxSizing: "border-box",
          color: category.color,
          display: "inline-flex",
          height: 24,
          lineHeight: 1,
          maxWidth: "100%",
          minWidth: 0,
          paddingInline: 8,
        }}
      >
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {category.label}
        </span>
      </span>
    </div>
  );
}

export const categoryBadgeCellRenderer: CellRenderer = {
  component: CategoryBadgeCell,
  id: "category-badge",
  name: "Badge",
};
