import { Badge, Box, Button, Group, MultiSelect, Popover, Radio, Stack, Text } from "@mantine/core";
import type { FilterProps } from "@/table/features/cell-visualization/types";
import type { RowData } from "@tanstack/react-table";
import { assertCategoricalArrayColumn } from "../types";
import type { CategoricalArrayFilterValue } from "../filter-fn";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import React, { useLayoutEffect, useState } from "react";
import { FunnelIcon } from "lucide-react";

const UNDEFINED_PLACEHOLDER = crypto.randomUUID();

export function CategoricalArrayFilter<TData extends RowData>({
  column,
  width,
  height,
}: FilterProps<TData>) {
  assertCategoricalArrayColumn(column);

  const externalFilterValue = column.getFilterValue() as CategoricalArrayFilterValue;

  const [categories, setCategories] = useState(externalFilterValue?.categories ?? null);
  const [op, setOp] = useState(externalFilterValue?.op ?? null);

  const categoriesList = React.useMemo(() => {
    return column.feature().getCategories();
  }, [column]);
  const comboboxItems = React.useMemo(() => {
    return categoriesList.map((category) => ({
      value: category.value ?? UNDEFINED_PLACEHOLDER,
      label: category.label,
    }));
  }, [categoriesList]);
  const categoryLabels = React.useMemo(
    () => new Map(comboboxItems.map((item) => [item.value, item.label])),
    [comboboxItems],
  );

  const value = React.useMemo(
    () => categories?.map((value) => (value === undefined ? UNDEFINED_PLACEHOLDER : value)) ?? [],
    [categories],
  );

  const selectedCategories = categories ?? [];
  const hasFilter = selectedCategories.length > 0;
  const triggerLabel =
    selectedCategories.length === 1
      ? (categoryLabels.get(selectedCategories[0] ?? UNDEFINED_PLACEHOLDER) ?? "(Missing)")
      : `${selectedCategories.length} selected`;

  useLayoutEffect(() => {
    setCategories(externalFilterValue?.categories ?? null);
    if (externalFilterValue !== undefined) {
      setOp(externalFilterValue.op);
    }
  }, [externalFilterValue]);

  const maybeSetFilterValue = useDebouncedCallback(
    (nextValue: CategoricalArrayFilterValue) => {
      column.setFilterValue(nextValue);
    },
    { wait: 250 },
  );

  return (
    <Box style={{ alignItems: "center", display: "flex", height, minHeight: 0, width }}>
      <Popover position="bottom-start" shadow="md" width={260} withArrow>
        <Popover.Target>
          <Button
            color={hasFilter ? "gray" : undefined}
            fullWidth
            justify="flex-start"
            leftSection={<FunnelIcon size={12} />}
            rightSection={
              hasFilter ? (
                <Badge size="xs" style={{ whiteSpace: "nowrap", textOverflow: "unset" }}>
                  {op}
                </Badge>
              ) : null
            }
            size="xs"
            style={{ minHeight: 0, width }}
            variant={hasFilter ? "light" : "default"}
          >
            <Text size="xs" style={{ minWidth: 0 }} truncate>
              {hasFilter ? triggerLabel : "Filter..."}
            </Text>
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="md">
            <MultiSelect
              clearable
              data={comboboxItems}
              maxDropdownHeight={192}
              nothingFoundMessage="No items found."
              onChange={(newValue) => {
                if (newValue.length === 0) {
                  setCategories(null);
                  maybeSetFilterValue(undefined);
                } else {
                  const newCategories = newValue.map((value) =>
                    value === UNDEFINED_PLACEHOLDER ? undefined : value,
                  );
                  const newOp = op ?? "and";

                  setCategories(newCategories);
                  setOp(newOp);
                  maybeSetFilterValue({
                    op: newOp,
                    categories: newCategories,
                  });
                }
              }}
              placeholder="Filter..."
              searchable
              size="xs"
              value={value}
            />

            <Radio.Group
              value={op ?? "and"}
              onChange={(value) => {
                const newOp = value === "or" ? "or" : "and";

                setOp(newOp);
                if (categories !== null) {
                  maybeSetFilterValue({
                    op: newOp,
                    categories,
                  });
                }
              }}
            >
              <Group gap="md">
                <Radio label="And" size="xs" value="and" />
                <Radio label="Or" size="xs" value="or" />
              </Group>
            </Radio.Group>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Box>
  );
}
