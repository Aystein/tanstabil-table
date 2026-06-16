import type { Column, RowData } from "@tanstack/react-table";
import { isNumberColumn } from "@/table/number-column/typeguards";
import type { TableInstance, TableRow } from "@/table/table-types";

export type NumberTableColumn<TData extends RowData> = Column<any, TData, number | undefined>;

export type ScatterPoint = {
  count: number;
  kind: "group" | "row";
  label: string;
  rowId: string;
  x: number;
  y: number;
};

export function getColumnLabel<TData extends RowData>(column: Column<any, TData, any>) {
  return typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
}

export function getNumberColumns<TData extends RowData>(instance: TableInstance<TData>) {
  return instance.getAllLeafColumns().filter(isNumberColumn) as NumberTableColumn<TData>[];
}

function getFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getLeafRows<TData extends RowData>(row: TableRow<TData>): TableRow<TData>[] {
  const subRows = row.subRows as TableRow<TData>[];

  if (subRows.length === 0) {
    return [row];
  }

  return subRows.flatMap((subRow) => getLeafRows(subRow));
}

function getAverageValue<TData extends RowData>(rows: TableRow<TData>[], columnId: string) {
  let sum = 0;
  let count = 0;

  for (const row of rows) {
    const value = getFiniteNumber(row.getValue(columnId));

    if (value === undefined) {
      continue;
    }

    sum += value;
    count += 1;
  }

  return count === 0 ? undefined : sum / count;
}

function getGroupedRowLabel<TData extends RowData>(row: TableRow<TData>) {
  const groupedCells = row.getAllCells().filter((cell) => cell.getIsGrouped());
  const labels = groupedCells.map((cell) => {
    const value = row.getGroupingValue(cell.column.id);

    if (value === undefined || value === null || value === "") {
      return "(empty)";
    }

    return typeof value === "string" || typeof value === "number"
      ? String(value)
      : JSON.stringify(value);
  });

  return labels.length === 0 ? row.id : labels.join(" / ");
}

function collectGroupedRows<TData extends RowData>(rows: TableRow<TData>[]): TableRow<TData>[] {
  return rows.flatMap((row): TableRow<TData>[] => {
    const subRows = row.subRows as TableRow<TData>[];

    if (!row.getIsGrouped()) {
      return collectGroupedRows(subRows);
    }

    return [row, ...collectGroupedRows(subRows)];
  });
}

export function getScatterPoints<TData extends RowData>({
  rows,
  xColumnId,
  yColumnId,
}: {
  rows: TableRow<TData>[];
  xColumnId: string;
  yColumnId: string;
}): ScatterPoint[] {
  const groupedRows = collectGroupedRows(rows);

  if (groupedRows.length > 0) {
    return groupedRows.flatMap((row): ScatterPoint[] => {
      const leafRows = getLeafRows(row);
      const x = getAverageValue(leafRows, xColumnId);
      const y = getAverageValue(leafRows, yColumnId);

      if (x === undefined || y === undefined) {
        return [];
      }

      return [
        {
          count: leafRows.length,
          kind: "group",
          label: getGroupedRowLabel(row),
          rowId: row.id,
          x,
          y,
        },
      ];
    });
  }

  const points: ScatterPoint[] = [];

  for (const row of rows) {
    if (row.getIsGrouped()) {
      continue;
    }

    const x = getFiniteNumber(row.getValue(xColumnId));
    const y = getFiniteNumber(row.getValue(yColumnId));

    if (x === undefined || y === undefined) {
      continue;
    }

    points.push({
      count: 1,
      kind: "row",
      label: row.id,
      rowId: row.id,
      x,
      y,
    });
  }

  return points;
}

export function getDomain(values: number[]): [number, number] | undefined {
  let min = Infinity;
  let max = -Infinity;

  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  if (min === Infinity || max === -Infinity) {
    return undefined;
  }

  if (min === max) {
    return [min - 1, max + 1];
  }

  const padding = (max - min) * 0.04;
  return [min - padding, max + padding];
}

function scaleLinear(value: number, domain: [number, number], range: [number, number]) {
  const ratio = (value - domain[0]) / (domain[1] - domain[0]);
  return range[0] + ratio * (range[1] - range[0]);
}

function getCssVar(element: Element, name: string, fallback: string) {
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

export function drawScatterPlot({
  context,
  cssHeight,
  cssWidth,
  maxPointCount,
  points,
  xDomain,
  xLabel,
  yDomain,
  yLabel,
}: {
  context: CanvasRenderingContext2D;
  cssHeight: number;
  cssWidth: number;
  maxPointCount: number;
  points: ScatterPoint[];
  xDomain: [number, number];
  xLabel: string;
  yDomain: [number, number];
  yLabel: string;
}) {
  const canvas = context.canvas;
  const ratioX = canvas.width / Math.max(cssWidth, 1);
  const ratioY = canvas.height / Math.max(cssHeight, 1);
  const foreground = getCssVar(canvas, "--foreground", "black");
  const muted = getCssVar(canvas, "--muted-foreground", "gray");
  const border = getCssVar(canvas, "--border", "lightgray");
  const pointColor = getCssVar(canvas, "--chart-3", foreground);
  const groupStroke = getCssVar(canvas, "--background", "white");
  const padding = { bottom: 36, left: 48, right: 18, top: 14 };
  const plotWidth = Math.max(cssWidth - padding.left - padding.right, 1);
  const plotHeight = Math.max(cssHeight - padding.top - padding.bottom, 1);
  const x0 = padding.left;
  const y0 = padding.top + plotHeight;

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(ratioX, 0, 0, ratioY, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  context.lineWidth = 1;
  context.strokeStyle = border;
  context.fillStyle = muted;
  context.font = "11px sans-serif";
  context.textBaseline = "middle";

  for (let index = 0; index <= 4; index += 1) {
    const x = x0 + (plotWidth / 4) * index;
    const y = padding.top + (plotHeight / 4) * index;

    context.beginPath();
    context.moveTo(x, padding.top);
    context.lineTo(x, y0);
    context.moveTo(x0, y);
    context.lineTo(x0 + plotWidth, y);
    context.stroke();
  }

  context.strokeStyle = foreground;
  context.beginPath();
  context.moveTo(x0, padding.top);
  context.lineTo(x0, y0);
  context.lineTo(x0 + plotWidth, y0);
  context.stroke();

  context.fillStyle = muted;
  context.textAlign = "center";
  context.fillText(xLabel, x0 + plotWidth / 2, cssHeight - 12);
  context.save();
  context.translate(13, padding.top + plotHeight / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(yLabel, 0, 0);
  context.restore();

  for (const point of points) {
    const x = scaleLinear(point.x, xDomain, [x0, x0 + plotWidth]);
    const y = scaleLinear(point.y, yDomain, [y0, padding.top]);
    const radius =
      point.kind === "group"
        ? scaleLinear(Math.sqrt(point.count), [1, Math.sqrt(maxPointCount)], [4, 15])
        : 2.4;

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.globalAlpha = point.kind === "group" ? 0.62 : 0.72;
    context.fillStyle = pointColor;
    context.fill();

    if (point.kind === "group") {
      context.globalAlpha = 0.9;
      context.lineWidth = 1.5;
      context.strokeStyle = groupStroke;
      context.stroke();
    }
  }

  context.globalAlpha = 1;
}
