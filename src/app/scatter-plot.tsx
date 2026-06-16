import type { RowData } from "@tanstack/react-table";
import { Box, Center, Group, NativeSelect, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { useCanvas } from "@/hooks/use-canvas";
import { useFrameEffect } from "@/hooks/use-frame-effect";
import type { TableInstance, TableRow } from "@/table/table-types";
import {
  drawScatterPlot,
  getColumnLabel,
  getDomain,
  getNumberColumns,
  getScatterPoints,
} from "./scatter-plot-utils";

function ScatterPlotContent<TData extends RowData>({
  instance,
}: {
  instance: TableInstance<TData>;
}) {
  const { context, height, pixelHeight, pixelWidth, ref, width } = useCanvas();
  const [xColumnId, setXColumnId] = useState<string | undefined>();
  const [yColumnId, setYColumnId] = useState<string | undefined>();
  const numberColumns = getNumberColumns(instance);
  const selectedXColumn = numberColumns.find((column) => column.id === xColumnId);
  const selectedYColumn = numberColumns.find((column) => column.id === yColumnId);
  const xColumn = selectedXColumn ?? numberColumns[0];
  const yColumn = selectedYColumn ?? numberColumns[1] ?? numberColumns[0];
  const rows = instance.getRowModel().rows as TableRow<TData>[];
  const points = useMemo(() => {
    if (xColumn === undefined || yColumn === undefined) {
      return [];
    }

    return getScatterPoints({
      rows,
      xColumnId: xColumn.id,
      yColumnId: yColumn.id,
    });
  }, [rows, xColumn, yColumn]);
  const xDomain = useMemo(() => getDomain(points.map((point) => point.x)), [points]);
  const yDomain = useMemo(() => getDomain(points.map((point) => point.y)), [points]);
  const hasGroupedPoints = points.some((point) => point.kind === "group");
  const maxPointCount = useMemo(() => Math.max(1, ...points.map((point) => point.count)), [points]);

  useEffect(() => {
    if (xColumnId === undefined && xColumn !== undefined) {
      setXColumnId(xColumn.id);
    }

    if (yColumnId === undefined && yColumn !== undefined) {
      setYColumnId(yColumn.id);
    }
  }, [xColumn, xColumnId, yColumn, yColumnId]);

  useFrameEffect(() => {
    if (
      context === null ||
      width === 0 ||
      height === 0 ||
      pixelWidth === 0 ||
      pixelHeight === 0 ||
      xColumn === undefined ||
      yColumn === undefined ||
      xDomain === undefined ||
      yDomain === undefined
    ) {
      return;
    }

    drawScatterPlot({
      context,
      cssHeight: height,
      cssWidth: width,
      maxPointCount,
      points,
      xDomain,
      xLabel: getColumnLabel(xColumn),
      yDomain,
      yLabel: getColumnLabel(yColumn),
    });
  }, [
    context,
    width,
    height,
    pixelWidth,
    pixelHeight,
    maxPointCount,
    points,
    xDomain,
    yDomain,
    xColumn,
    yColumn,
  ]);

  if (numberColumns.length === 0) {
    return (
      <Center c="dimmed" fz="xs" h="100%">
        No numeric columns available.
      </Center>
    );
  }

  return (
    <Box
      bg="var(--color-background)"
      h="100%"
      mih={0}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Group
        gap="sm"
        mih={40}
        px="sm"
        style={{ borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}
        wrap="nowrap"
      >
        <NativeSelect
          aria-label="X axis"
          data={numberColumns.map((column) => ({
            label: getColumnLabel(column),
            value: column.id,
          }))}
          label="X"
          size="xs"
          value={xColumn?.id ?? ""}
          onChange={(event) => setXColumnId(event.target.value)}
        />

        <NativeSelect
          aria-label="Y axis"
          data={numberColumns.map((column) => ({
            label: getColumnLabel(column),
            value: column.id,
          }))}
          label="Y"
          size="xs"
          value={yColumn?.id ?? ""}
          onChange={(event) => setYColumnId(event.target.value)}
        />

        <Text c="dimmed" ml="auto" size="xs" style={{ fontVariantNumeric: "tabular-nums" }}>
          {points.length.toLocaleString()} {hasGroupedPoints ? "groups" : "rows"}
        </Text>
      </Group>

      <Box mih={0} p="xs" style={{ flex: "1 1 0" }}>
        <canvas
          ref={ref}
          height={pixelHeight}
          style={{ height: "100%", width: "100%" }}
          width={pixelWidth}
        />
      </Box>
    </Box>
  );
}

export function ScatterPlot<TData extends RowData>({
  instance,
  isLoading,
}: {
  instance: TableInstance<TData>;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Center h="100%">Loading data...</Center>;
  }

  return (
    <instance.Subscribe selector={(state) => state}>
      {() => <ScatterPlotContent instance={instance} />}
    </instance.Subscribe>
  );
}
