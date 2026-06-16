import type { CellContext, RowData, TableFeatures } from "@tanstack/react-table";
import { Box, Text } from "@mantine/core";
import { assertIsCategoryColumn } from "../types";

export function CategoryCell({
  getValue,
  column,
}: CellContext<TableFeatures, RowData, string | undefined>) {
  assertIsCategoryColumn(column);

  const feature = column.feature();

  const value = getValue();
  const map = feature.getValueToCategoryMap();

  const category = map.get(value);

  if (category === undefined) {
    return <></>;
  }

  return (
    <Box
      h="100%"
      miw={0}
      w="100%"
      style={{ alignItems: "center", display: "flex", gap: "0.5rem", position: "relative" }}
    >
      <Box
        component="span"
        style={{ backgroundColor: category.color, left: 1, top: 1, bottom: 2 }}
        w={4}
        pos="absolute"
      />
      <Text
        component="span"
        miw={0}
        size="sm"
        truncate
        style={{
          lineHeight: "inherit",
          paddingInline: column.table.atoms.cellPadding.get(),
        }}
      >
        {category.label}
      </Text>
    </Box>
  );
}
