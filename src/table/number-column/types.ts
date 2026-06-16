import { z } from "zod";
import type { TypedColumnTypes } from "../features/core-feature/types";
import type { RowData } from "@tanstack/react-table";
import type { Bin } from "d3";

export interface NumberFeatureShape {
  getDomain: () => [number, number] | undefined;
  getColorScale: () => (value: number | undefined) => string;
  getCoreBins: () => Bin<number, number>[];
  getGroupingValue: (value: number | undefined) => string | undefined;
}

export const CellValueSchema = z.number().optional();

export type CellValue = z.infer<typeof CellValueSchema>;

export const AggregationValueSchema = z.object({
  min: z.number(),
  q1: z.number(),
  median: z.number(),
  q3: z.number(),
  max: z.number(),
});

export type AggregationValue = z.infer<typeof AggregationValueSchema>;

export const BrushFilterValueSchema = z.object({
  mode: z.literal("brush"),
  min: z.number().optional(),
  max: z.number().optional(),
});

export const BinFilterValueSchema = z.object({
  mode: z.literal("bins"),
  binIds: z.array(z.string()),
});

const LegacyFilterValueSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
});

export const FilterValueSchema = z.union([
  BrushFilterValueSchema,
  BinFilterValueSchema,
  LegacyFilterValueSchema,
]);

export type FilterValue = z.infer<typeof FilterValueSchema>;

export type NumberColumnBinning =
  | {
      mode: "auto";
      count?: number;
    }
  | {
      mode: "exact";
      count?: number;
    }
  | {
      mode: "custom";
      thresholds: number[];
    };

type NumberColumnTypes<TData extends RowData> = TypedColumnTypes<
  TData,
  "number",
  NumberFeatureShape,
  CellValue,
  {
    bins?: NumberColumnBinning;
  }
>;

export type NumberColumnDef<TData extends RowData> = NumberColumnTypes<TData>["def"];

export type NumberColumn<TData extends RowData> = NumberColumnTypes<TData>["column"];
