import { Box, HoverCard, Stack, Text } from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import type { CellRenderer } from "@/table/features/cell-visualization/types";
import type { TanstabilCellContext } from "@/table/table-types";
import { isNumberColumn } from "../typeguards";
import {
  getNumberHistogramDomain,
  getNumberHistogramEntries,
  getNumberHistogramMax,
  NumberHistogramPlot,
  useNumberHistogramBarLayout,
} from "./number-histogram";
import { NumberFilterBinLayer } from "./number-filter-bin-layer";
import { getBinIndexForX } from "./use-number-filter-brush";

const formatter = new Intl.NumberFormat();

export function NumberColumnHistogramSummaryCell<TData extends RowData>({
  column,
  row,
  table,
}: TanstabilCellContext<TData, unknown>) {
  if (!isNumberColumn(column)) {
    return null;
  }

  const feature = column.feature();
  const domain = feature.getDomain();
  const bins = useMemo(
    () => (domain === undefined ? [] : feature.getCoreBins()),
    [domain, feature],
  );
  const binDomain = useMemo(() => getNumberHistogramDomain(bins, domain), [bins, domain]);
  const leafRows = row.getLeafRows();
  const histogram = useMemo(
    () =>
      getNumberHistogramEntries({
        binDomain,
        bins,
        columnId: column.id,
        rows: leafRows,
      }),
    [binDomain, bins, column.id, leafRows],
  );
  const max = useMemo(() => getNumberHistogramMax(histogram), [histogram]);
  const colorScale = feature.getColorScale();
  const width = Math.max(1, column.getSize() - table.atoms.cellPadding.get() * 2);
  const height = table.atoms.rowHeight.get();
  const labelHeight = Math.min(14, height);
  const histogramHeight = Math.max(height - labelHeight, 0);
  const cssBarLayout = useNumberHistogramBarLayout({ binCount: bins.length, width });
  const [hoveredBinIndex, setHoveredBinIndex] = useState<number | undefined>(undefined);
  const hoveredEntry = hoveredBinIndex === undefined ? undefined : histogram[hoveredBinIndex];
  const hoveredBin = hoveredEntry?.bin;

  if (domain === undefined) {
    return table.options.renderFallbackValue;
  }

  return (
    <HoverCard position="bottom-start" shadow="md" width={224} withArrow>
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height,
          width,
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
            <Box
              onPointerLeave={() => setHoveredBinIndex(undefined)}
              onPointerMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const nextIndex = getBinIndexForX(x, cssBarLayout);

                setHoveredBinIndex(nextIndex === -1 ? undefined : nextIndex);
              }}
              style={{
                cursor: "default",
                inset: 0,
                outline: "none",
                position: "absolute",
              }}
            >
              <svg
                focusable="false"
                role="presentation"
                style={{
                  height: "100%",
                  outline: "none",
                  overflow: "visible",
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
                  selectedBinIds={[]}
                />
              </svg>
            </Box>
          </HoverCard.Target>
        </NumberHistogramPlot>

        <Box
          style={{
            display: "flex",
            height: labelHeight,
            justifyContent: "space-between",
            userSelect: "none",
          }}
        >
          <Text c="var(--color-accent-foreground)" size="10px">
            {formatter.format(binDomain[0])}
          </Text>
          <Text c="var(--color-accent-foreground)" size="10px">
            {formatter.format(binDomain[1])}
          </Text>
        </Box>
      </Box>

      <HoverCard.Dropdown>
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
          {hoveredEntry === undefined ? null : (
            <Text c="dimmed" size="11px">
              {formatter.format(hoveredEntry.filteredCount)}/
              {formatter.format(hoveredEntry.totalCount)} rows
            </Text>
          )}
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}

export const numberHistogramSummaryCellRenderer: CellRenderer = {
  component: NumberColumnHistogramSummaryCell,
  id: "number-histogram-summary",
  name: "Histogram",
};
