import {
  memo,
  type Column,
  type RowData,
  type Table_Internal,
  type TableFeatures,
} from "@tanstack/react-table";
import type { Bin } from "d3";
import type { NumberColumnBinning, NumberFeatureShape } from "./types";
import { scaleSequential, interpolateBlues, bin } from "d3";
import { isNumberColumn } from "./typeguards";

type NumberHistogramGenerator = {
  (data: Iterable<number>): Bin<number, number>[];
  domain: (domain: [number, number]) => NumberHistogramGenerator;
  thresholds: (thresholds: number | number[]) => NumberHistogramGenerator;
};

const formatter = new Intl.NumberFormat();

export type NumberBinModel = {
  domain: [number, number] | undefined;
  bins: Bin<number, number>[];
  getGroupingValue: (value: number | undefined) => string | undefined;
};

export function getNumberColumnDomain(values: Iterable<number>) {
  let min = Infinity;
  let max = -Infinity;

  for (const value of values) {
    if (Number.isNaN(value)) {
      continue;
    }

    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  return min === Infinity || max === -Infinity
    ? undefined
    : ([min, max] satisfies [number, number]);
}

export function getNumberBinId(
  bin: Pick<Bin<number, number>, "x0" | "x1">,
  fallbackValue = 0,
): string {
  return `${formatter.format(bin.x0 ?? fallbackValue)} - ${formatter.format(bin.x1 ?? fallbackValue)}`;
}

export function getNumberBins(
  values: Iterable<number>,
  binning: NumberColumnBinning | undefined,
  domain: [number, number],
): Bin<number, number>[] {
  const binner = bin() as unknown as NumberHistogramGenerator;

  if (binning?.mode === "custom") {
    return binner.domain(domain).thresholds(binning.thresholds)(values);
  }

  if (binning?.mode === "exact") {
    const count = Math.max(1, Math.floor(binning.count ?? 10));
    const step = (domain[1] - domain[0]) / count;
    const thresholds = Array.from({ length: Math.max(0, count - 1) }, (_, index) => {
      return domain[0] + step * (index + 1);
    });

    return binner.domain(domain).thresholds(thresholds)(values);
  }

  return binner.thresholds(binning?.count ?? 10)(values);
}

export function getNumberBinGroupingValue(
  bins: Bin<number, number>[],
  value: number | undefined,
): string | undefined {
  if (value === undefined || Number.isNaN(value)) {
    return undefined;
  }

  const bin = bins.find((entry, index) => {
    const x0 = entry.x0 ?? -Infinity;
    const x1 = entry.x1 ?? Infinity;

    return index === bins.length - 1 ? value >= x0 && value <= x1 : value >= x0 && value < x1;
  });

  if (bin === undefined) {
    return undefined;
  }

  return getNumberBinId(bin, value);
}

export function getNumberBinModel(
  values: Iterable<number>,
  binning: NumberColumnBinning | undefined,
): NumberBinModel {
  const numericValues = Array.from(values).filter((value) => !Number.isNaN(value));
  const domain = getNumberColumnDomain(numericValues);

  if (domain === undefined) {
    return {
      domain,
      bins: [],
      getGroupingValue: () => undefined,
    };
  }

  const bins = getNumberBins(numericValues, binning, domain);

  return {
    domain,
    bins,
    getGroupingValue: (value) => getNumberBinGroupingValue(bins, value),
  };
}

export function createNumberFeature<TFeatures extends TableFeatures, TData extends RowData>(
  table: Table_Internal<TFeatures, TData>,
  column: Column<TFeatures, TData>,
): NumberFeatureShape {
  if (!isNumberColumn(column)) {
    throw new Error("Column is not a number column");
  }

  const _getCoreValues = memo({
    fn: (rowModel) => {
      const { flatRows } = rowModel;
      const values: number[] = [];

      for (let i = 0; i < flatRows.length; i++) {
        const row = flatRows[i]!;
        const value = row.getValue<number | undefined>(column.id);

        if (value !== undefined && !Number.isNaN(value)) {
          values.push(value);
        }
      }

      return values;
    },
    memoDeps: () => [table.getCoreRowModel()],
  });

  const _getCoreBinModel = memo({
    fn: (values, binning) => getNumberBinModel(values, binning),
    memoDeps: () => [_getCoreValues(), column.columnDef.bins],
  });

  return {
    getDomain: () => _getCoreBinModel().domain,
    getColorScale: memo({
      fn: (domain) => {
        if (domain === undefined) {
          return () => "white";
        }

        return scaleSequential(domain, interpolateBlues).unknown("white") as (
          value: number | undefined,
        ) => string;
      },
      memoDeps: () => [_getCoreBinModel().domain],
    }),
    getGroupingValue: (value) => _getCoreBinModel().getGroupingValue(value),
    getCoreBins: () => _getCoreBinModel().bins,
  };
}
