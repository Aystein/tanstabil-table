import * as React from "react";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import type { FilterProps } from "@/table/features/cell-visualization/types";
import type { RowData } from "@tanstack/react-table";
import { Box, TextInput } from "@mantine/core";

export function Filter<TData extends RowData>({ column, width, height }: FilterProps<TData>) {
  const filterValue = column.getFilterValue();
  const externalValue = typeof filterValue === "string" ? filterValue : "";
  const [inputValue, setInputValue] = React.useState(externalValue);

  React.useLayoutEffect(() => {
    setInputValue(externalValue);
  }, [externalValue]);

  const maybeSetFilterValue = useDebouncedCallback(
    (nextValue: string | undefined) => {
      column.setFilterValue(nextValue);
    },
    { wait: 250 },
  );

  return (
    <Box style={{ alignItems: "center", display: "flex", height, minHeight: 0, width }}>
      <TextInput
        value={inputValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInputValue(nextValue);
          maybeSetFilterValue(nextValue || undefined);
        }}
        placeholder="Filter..."
        size="xs"
        style={{ width }}
      />
    </Box>
  );
}
