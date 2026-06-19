import { Box, Group, HoverCard, MultiSelect, Stack, Text } from "@mantine/core";
import type { FilterProps } from "@/table/features/cell-visualization/types";
import { useCanvas } from "@/hooks/use-canvas";
import { useFrameEffect } from "@/hooks/use-frame-effect";
import type { RowData } from "@tanstack/react-table";
import { assertIsCategoryColumn } from "../types";
import { drawCategoryFilterHistogram } from "./category-filter-canvas";
import { CategoryFilterHoverLayer } from "./category-filter-hover-layer";
import { useCategoryFilterModel } from "./use-category-filter-model";

export function CategoryFilter<TData extends RowData>({
  table,
  column,
  width,
  height,
}: FilterProps<TData>) {
  assertIsCategoryColumn(column);

  const { ref, pixelWidth, pixelHeight, context } = useCanvas();
  const {
    comboboxItems,
    facetedUniqueValues,
    getComboboxChipLabel,
    hasFilter,
    hoveredCategoryIndex,
    histogram,
    histogramHeight,
    labelHeight,
    max,
    onComboboxValueChange,
    onFilterClick,
    onFilterPointerLeave,
    onFilterPointerMove,
    selectedCategories,
    selectedComboboxValues,
    showLabels,
    totalUniqueValues,
  } = useCategoryFilterModel({
    column,
    height,
    width,
  });

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
    label: item.category.label,
    value: item.value,
  }));

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
        position: "relative",
        width,
        height,
      }}
    >
      <Box style={{ position: "relative", width, height: histogramHeight }}>
        <canvas
          ref={ref}
          style={{ height: "100%", pointerEvents: "none", width: "100%" }}
          width={pixelWidth}
          height={pixelHeight}
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

      <HoverCard position="bottom-start" shadow="md" width={260} withArrow>
        <HoverCard.Target>
          <div
            onClick={onFilterClick}
            onPointerLeave={onFilterPointerLeave}
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
          <MultiSelect
            clearable
            data={multiSelectData}
            maxDropdownHeight={192}
            nothingFoundMessage="No items found."
            onChange={onComboboxValueChange}
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
            value={selectedComboboxValues}
          />
          {selectedComboboxValues.length > 0 ? (
            <Stack gap={2} mt="xs">
              {selectedComboboxValues.map((value) => (
                <Text c="dimmed" key={value} size="10px" truncate>
                  {getComboboxChipLabel(value)}
                </Text>
              ))}
            </Stack>
          ) : null}
        </HoverCard.Dropdown>
      </HoverCard>
    </Box>
  );
}
