import type { RowData } from "@tanstack/react-table";
import type { TableInstance } from "@/table/table-types";
import { useMemo } from "react";
import { HoverCard, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import type { FilterProps } from "@/table/features/cell-visualization/types";
import { isNumberColumn } from "../typeguards";
import type { NumberColumn } from "../types";
import {
  getNumberHistogramDomain,
  getNumberHistogramEntries,
  getNumberHistogramMax,
  NumberHistogramPlot,
  useNumberHistogramBarLayout,
  useNumberHistogramScale,
} from "./number-histogram";
import { NumberFilterBinLayer } from "./number-filter-bin-layer";
import { formatInputValue, useNumberFilterBrush } from "./use-number-filter-brush";

const formatter = new Intl.NumberFormat();

export function NumberFilter<TData extends RowData>({
  table,
  column,
  width,
  height,
}: FilterProps<TData>) {
  if (!isNumberColumn(column)) {
    return null;
  }

  return <NumberColumnHistogram column={column} height={height} table={table} width={width} />;
}

function NumberColumnHistogram<TData extends RowData>({
  table,
  column,
  width,
  height,
}: {
  table: TableInstance<TData>;
  column: NumberColumn<TData>;
  width: number;
  height: number;
}) {
  const feature = column.feature();
  const domain = feature.getDomain();
  const colorScale = feature.getColorScale();
  const bins = useMemo(
    () => (domain === undefined ? [] : feature.getCoreBins()),
    [domain, feature],
  );
  const binDomain = useMemo(() => getNumberHistogramDomain(bins, domain), [bins, domain]);
  const facetedRowModel = column.getFacetedRowModel();
  const histogram = useMemo(
    () =>
      getNumberHistogramEntries({
        binDomain,
        bins,
        columnId: column.id,
        rows: facetedRowModel.flatRows,
      }),
    [binDomain, bins, column.id, facetedRowModel],
  );
  const max = useMemo(() => getNumberHistogramMax(histogram), [histogram]);

  const labelHeight = 14;
  const histogramHeight = height - labelHeight;
  const cssXScale = useNumberHistogramScale({ binDomain, width });
  const cssBarLayout = useNumberHistogramBarLayout({ binCount: bins.length, width });
  const {
    brushMin,
    brushWidth,
    brushX,
    gestureBind,
    hoveredBinIndex,
    isDragging,
    maxInput,
    minInput,
    onMaxInputChange,
    onMinInputChange,
    selectedBinIds,
    svgRef,
  } = useNumberFilterBrush({
    binDomain,
    bins,
    column,
    cssBarLayout,
    xScale: cssXScale,
  });
  const hoveredBin = hoveredBinIndex === undefined ? undefined : bins[hoveredBinIndex];

  if (domain === undefined) {
    return table.options.renderFallbackValue;
  }

  return (
    <HoverCard position="bottom-start" shadow="md" width={240} withArrow>
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <NumberHistogramPlot
          binDomain={binDomain}
          colorScale={colorScale}
          height={histogramHeight}
          histogram={histogram}
          max={max}
          width={width}
        >
          <HoverCard.Target>
            <div
              style={{
                cursor: isDragging ? "ew-resize" : "default",
                inset: 0,
                outline: "none",
                position: "absolute",
                touchAction: "none",
              }}
            >
              <svg
                ref={svgRef}
                {...gestureBind()}
                focusable="false"
                role="presentation"
                style={{
                  cursor: isDragging ? "ew-resize" : undefined,
                  height: "100%",
                  outline: "none",
                  overflow: "visible",
                  touchAction: "none",
                  width: "100%",
                }}
                tabIndex={-1}
                viewBox={`0 0 ${width} ${histogramHeight}`}
              >
                <NumberFilterBinLayer
                  cssBarLayout={cssBarLayout}
                  bins={bins}
                  histogramHeight={histogramHeight}
                  hoveredBinIndex={hoveredBinIndex}
                  selectedBinIds={selectedBinIds}
                />
                {brushMin === undefined ? null : (
                  <>
                    <rect
                      x={brushX}
                      y={1}
                      width={brushWidth}
                      height={Math.max(histogramHeight - 2, 0)}
                      cursor={isDragging ? "ew-resize" : "grab"}
                      fill="color-mix(in oklab, var(--color-primary) 10%, transparent)"
                      stroke="color-mix(in oklab, var(--color-primary) 70%, transparent)"
                      vectorEffect="non-scaling-stroke"
                    />
                    <rect
                      x={Math.max(brushX - 2, 0)}
                      y={1}
                      width={4}
                      height={Math.max(histogramHeight - 2, 0)}
                      cursor="ew-resize"
                      fill="var(--color-primary)"
                    />
                    <rect
                      x={Math.min(brushX + brushWidth - 2, width - 4)}
                      y={1}
                      width={4}
                      height={Math.max(histogramHeight - 2, 0)}
                      cursor="ew-resize"
                      fill="var(--color-primary)"
                    />
                  </>
                )}
              </svg>
            </div>
          </HoverCard.Target>
        </NumberHistogramPlot>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            userSelect: "none",
            height: labelHeight,
          }}
        >
          <Text c="var(--color-accent-foreground)" fz={10}>
            {formatter.format(binDomain[0])}
          </Text>
          <Text c="var(--color-accent-foreground)" fz={10}>
            {formatter.format(binDomain[1])}
          </Text>
        </div>
      </div>

      <HoverCard.Dropdown>
        <Stack gap="sm">
          <Stack gap={2}>
            <Text c="dimmed" fw={500} size="10px" tt="uppercase">
              Hovered bin
            </Text>
            <Text fw={500} size="xs">
              {hoveredBin === undefined
                ? "No bin"
                : `${formatter.format(hoveredBin.x0 ?? binDomain[0])} - ${formatter.format(
                    hoveredBin.x1 ?? binDomain[1],
                  )}`}
            </Text>
            {hoveredBin === undefined ? null : (
              <Text c="dimmed" size="11px">
                {formatter.format(histogram[hoveredBinIndex!]?.filteredCount ?? 0)}/
                {formatter.format(hoveredBin.length)} rows
              </Text>
            )}
          </Stack>

          <SimpleGrid cols={2} spacing="xs">
            <TextInput
              label="Min"
              onChange={(event) => onMinInputChange(event.target.value)}
              placeholder={formatInputValue(binDomain[0])}
              size="xs"
              type="number"
              value={minInput}
            />
            <TextInput
              label="Max"
              onChange={(event) => onMaxInputChange(event.target.value)}
              placeholder={formatInputValue(binDomain[1])}
              size="xs"
              type="number"
              value={maxInput}
            />
          </SimpleGrid>
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
