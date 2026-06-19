import type { RowData } from "@tanstack/react-table";
import type { TanstabilCellContext } from "@/table/table-types";
import { assertIsCategoryColumn } from "../types";
import type { CellRenderer } from "@/table/features/cell-visualization/types";

export function CategoryCell({
  getValue,
  column,
}: TanstabilCellContext<RowData, string | undefined>) {
  assertIsCategoryColumn(column);

  const feature = column.feature();

  const value = getValue();
  const map = feature.getValueToCategoryMap();

  const category = map.get(value);

  if (category === undefined) {
    return <></>;
  }

  return (
    <span
      style={{
        alignItems: "center",
        display: "flex",
        gap: "0.5rem",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundColor: category.color,
          borderRadius: "50%",
          flex: "0 0 auto",
          height: "0.625rem",
          width: "0.625rem",
        }}
      />
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
  );
}

export const categoryCellRenderer: CellRenderer = {
  component: CategoryCell,
  id: "category",
  name: "Category",
};
