import { Box, Group, HoverCard, MultiSelect, Radio, Stack, Text } from "@mantine/core";
import type { FilterProps } from "@/table/features/cell-visualization/types";
import { useCanvas } from "@/hooks/use-canvas";
import { useFrameEffect } from "@/hooks/use-frame-effect";
import type { RowData } from "@tanstack/react-table";
import { assertCategoricalArrayColumn } from "../types";
import type { CategoricalArrayFilterValue } from "../filter-fn";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { drawCategoryFilterHistogram } from "../../category-column/components/category-filter-canvas";
import type { CategoryFilterOptionValue } from "../../category-column/components/use-category-filter-model";
import { CategoryFilterHoverLayer } from "../../category-column/components/category-filter-hover-layer";

const UNDEFINED_PLACEHOLDER = crypto.randomUUID();

export function CategoricalArrayFilter<TData extends RowData>({
  table,
  column,
  width,
  height,
}: FilterProps<TData>) {
  assertCategoricalArrayColumn(column);

  const { ref, pixelWidth, pixelHeight, context } = useCanvas();
  const externalFilterValue = column.getFilterValue() as CategoricalArrayFilterValue;
  const [categories, setCategories] = useState(externalFilterValue?.categories ?? null);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | undefined>(undefined);
  const [op, setOp] = useState(externalFilterValue?.op ?? null);

  const categoriesList = useMemo(() => {
    return column.feature().getCategories();
  }, [column]);
  const totalUniqueValues = column.getCoreUniqueValues();
  const facetedUniqueValues = column.getFacetedUniqueValues();
  const histogram = useMemo(
    () =>
      categoriesList.map((category) => ({
        category,
        filteredCount: facetedUniqueValues.get(category.value) ?? 0,
        totalCount: totalUniqueValues.get(category.value) ?? 0,
      })),
    [categoriesList, facetedUniqueValues, totalUniqueValues],
  );
  const max = useMemo(
    () => Math.max(0, ...histogram.map((entry) => Math.max(entry.filteredCount, entry.totalCount))),
    [histogram],
  );
  const labelHeight = Math.min(14, height);
  const histogramHeight = Math.max(height - labelHeight, 0);
  const categoryWidth = histogram.length === 0 ? 0 : width / histogram.length;
  const showLabels = categoryWidth >= 24;

  const comboboxItems = useMemo(() => {
    return categoriesList.map((category, index) => ({
      value: category.value === undefined ? UNDEFINED_PLACEHOLDER : `${index}:${category.value}`,
      label: category.label,
      category,
    }));
  }, [categoriesList]);
  const comboboxValueToCategoryValue = useMemo(() => {
    return new Map(comboboxItems.map((item) => [item.value, item.category.value]));
  }, [comboboxItems]);
  const categoryValueToComboboxValue = useMemo(() => {
    return new Map(comboboxItems.map((item) => [item.category.value, item.value]));
  }, [comboboxItems]);
  const categoryValueToLabel = useMemo(
    () => new Map(comboboxItems.map((item) => [item.category.value, item.label])),
    [comboboxItems],
  );

  const value = useMemo(
    () =>
      categories
        ?.map((category) => categoryValueToComboboxValue.get(category))
        .filter((category): category is string => category !== undefined) ?? [],
    [categories, categoryValueToComboboxValue],
  );

  const selectedCategories = categories ?? [];
  const hasFilter = selectedCategories.length > 0;

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

  const setFilterCategories = useCallback(
    (nextCategories: CategoryFilterOptionValue[] | null, nextOp = op ?? "and") => {
      if (nextCategories === null || nextCategories.length === 0) {
        setCategories(null);
        maybeSetFilterValue(undefined);
        return;
      }

      const stringCategories = nextCategories.filter(
        (category): category is string | undefined =>
          category === undefined || typeof category === "string",
      );

      setCategories(stringCategories);
      setOp(nextOp);
      maybeSetFilterValue({
        op: nextOp,
        categories: stringCategories,
      });
    },
    [maybeSetFilterValue, op],
  );

  const getCategoryIndexFromEvent = useCallback(
    (event: MouseEvent<HTMLElement> | PointerEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (
        width <= 0 ||
        x < 0 ||
        x > width ||
        y < 0 ||
        y > histogramHeight ||
        histogram.length === 0
      ) {
        return undefined;
      }

      return Math.min(histogram.length - 1, Math.floor((x / width) * histogram.length));
    },
    [histogram.length, histogramHeight, width],
  );

  const onFilterPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      setHoveredCategoryIndex(getCategoryIndexFromEvent(event));
    },
    [getCategoryIndexFromEvent],
  );

  const onFilterClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const categoryIndex = getCategoryIndexFromEvent(event);
      const category = categoryIndex === undefined ? undefined : histogram[categoryIndex]?.category;

      if (category === undefined) {
        return;
      }

      const nextCategories = categories === null ? [] : [...categories];

      if (!nextCategories.includes(category.value)) {
        nextCategories.push(category.value);
      }

      setFilterCategories(nextCategories);
    },
    [categories, getCategoryIndexFromEvent, histogram, setFilterCategories],
  );

  useFrameEffect(() => {
    if (context === null || pixelWidth === 0 || pixelHeight === 0) {
      return;
    }

    drawCategoryFilterHistogram({
      context,
      cssWidth: width,
      hasFilter,
      histogram,
      max,
      pixelHeight,
      pixelWidth,
      selectedCategories,
    });
  }, [context, width, pixelWidth, pixelHeight, histogram, max, hasFilter, selectedCategories]);

  if (histogram.length === 0) {
    return table.options.renderFallbackValue;
  }

  const categoryCounts = new Map(
    comboboxItems.map((item) => {
      const categoryValue = item.category.value;
      return [
        item.value,
        {
          color: item.category.color,
          filteredCount: facetedUniqueValues.get(categoryValue) ?? 0,
          totalCount: totalUniqueValues.get(categoryValue) ?? 0,
        },
      ];
    }),
  );
  const multiSelectData = comboboxItems.map((item) => ({
    label: item.label,
    value: item.value,
  }));

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height,
        overflow: "visible",
        position: "relative",
        width,
      }}
    >
      <Box style={{ height: histogramHeight, position: "relative", width }}>
        <canvas
          ref={ref}
          height={pixelHeight}
          style={{ height: "100%", pointerEvents: "none", width: "100%" }}
          width={pixelWidth}
        />
      </Box>

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${histogram.length}, minmax(0, 1fr))`,
          height: labelHeight,
          userSelect: "none",
        }}
      >
        {showLabels
          ? histogram.map(({ category }) => (
              <Text
                key={category.value ?? "__missing"}
                c="var(--color-accent-foreground)"
                px={2}
                fz={10}
                ta="center"
                title={category.label}
                truncate
              >
                {category.label}
              </Text>
            ))
          : null}
      </Box>

      <HoverCard position="bottom-start" shadow="md" width={280} withArrow>
        <HoverCard.Target>
          <div
            onClick={onFilterClick}
            onPointerLeave={() => setHoveredCategoryIndex(undefined)}
            onPointerMove={onFilterPointerMove}
            style={{ cursor: "pointer", inset: 0, position: "absolute" }}
          >
            <CategoryFilterHoverLayer
              height={histogramHeight}
              histogram={histogram}
              hoveredCategoryIndex={hoveredCategoryIndex}
              width={width}
            />
          </div>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Stack gap="md">
            <MultiSelect
              clearable
              data={multiSelectData}
              maxDropdownHeight={192}
              nothingFoundMessage="No items found."
              onChange={(newValue) => {
                const nextCategories = newValue.map((value) =>
                  comboboxValueToCategoryValue.get(value),
                );

                setFilterCategories(nextCategories);
              }}
              placeholder="Filter..."
              renderOption={({ option }) => {
                const counts = categoryCounts.get(option.value);

                return (
                  <Group gap="xs" wrap="nowrap">
                    <span
                      style={{
                        backgroundColor: counts?.color,
                        borderRadius: 999,
                        flexShrink: 0,
                        height: 8,
                        width: 8,
                      }}
                    />
                    <Text size="xs" style={{ flex: 1 }} truncate>
                      {option.label}
                    </Text>
                    <Text c="dimmed" size="11px" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {counts?.filteredCount ?? 0}/{counts?.totalCount ?? 0}
                    </Text>
                  </Group>
                );
              }}
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
                  setFilterCategories(categories, newOp);
                }
              }}
            >
              <Group gap="md">
                <Radio label="And" size="xs" value="and" />
                <Radio label="Or" size="xs" value="or" />
              </Group>
            </Radio.Group>
            {value.length > 0 ? (
              <Stack gap={2}>
                {selectedCategories.map((category) => (
                  <Text c="dimmed" key={category ?? "__missing"} size="10px" truncate>
                    {categoryValueToLabel.get(category) ?? "(Missing)"}
                  </Text>
                ))}
              </Stack>
            ) : null}
          </Stack>
        </HoverCard.Dropdown>
      </HoverCard>
    </Box>
  );
}
