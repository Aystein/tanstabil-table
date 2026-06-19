import { Button, Group, Modal, Select, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import type { RowData } from "@tanstack/react-table";
import type { TanstabilTable } from "@/table/table-types";
import type { NumberColumn, NumberColumnBinning } from "../types";

function getInitialBinning(
  table: TanstabilTable<RowData>,
  column: NumberColumn<any>,
): NumberColumnBinning {
  return table.atoms.bins.get()[column.id] ?? column.columnDef.bins ?? { mode: "auto" };
}

function parseThresholds(value: string) {
  return value
    .split(/[,\s]+/)
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry))
    .sort((a, b) => a - b);
}

function parseCount(value: string) {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function NumberColumnBinningDialog({
  table,
  column,
  open,
  onOpenChange,
}: {
  table: TanstabilTable<RowData>;
  column: NumberColumn<any>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<NumberColumnBinning["mode"]>("auto");
  const [count, setCount] = useState("");
  const [thresholds, setThresholds] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const binning = getInitialBinning(table, column);
    setMode(binning.mode);
    setCount("count" in binning && binning.count !== undefined ? String(binning.count) : "");
    setThresholds(
      binning.mode === "custom" && binning.thresholds.length > 0
        ? binning.thresholds.join(", ")
        : "",
    );
  }, [column, open, table]);

  function getNextBinning(): NumberColumnBinning {
    if (mode === "custom") {
      return {
        mode,
        thresholds: parseThresholds(thresholds),
      };
    }

    const parsedCount = parseCount(count);
    return parsedCount === undefined ? { mode } : { mode, count: parsedCount };
  }

  function handleApply() {
    const nextBinning = getNextBinning();

    table.setBins((previous) => ({
      ...previous,
      [column.id]: nextBinning,
    }));
    onOpenChange(false);
  }

  function handleReset() {
    table.setBins((previous) => {
      const next = { ...previous };
      delete next[column.id];
      return next;
    });
    onOpenChange(false);
  }

  return (
    <Modal centered onClose={() => onOpenChange(false)} opened={open} size="28rem" title="Binning">
      <Stack gap="md">
        <Text c="dimmed" size="xs">
          Configure histogram bins for {column.id}.
        </Text>

        <Stack gap="sm">
          <Select
            data={[
              { value: "auto", label: "Auto" },
              { value: "exact", label: "Exact" },
              { value: "custom", label: "Custom" },
            ]}
            label="Mode"
            onChange={(value) => setMode((value ?? "auto") as NumberColumnBinning["mode"])}
            size="xs"
            value={mode}
          />

          {mode === "custom" ? (
            <Textarea
              label="Thresholds"
              onChange={(event) => setThresholds(event.target.value)}
              placeholder="10, 20, 30"
              size="xs"
              value={thresholds}
            />
          ) : (
            <TextInput
              label="Count"
              min={1}
              onChange={(event) => setCount(event.target.value)}
              placeholder="10"
              size="xs"
              type="number"
              value={count}
            />
          )}
        </Stack>

        <Group gap="xs" justify="flex-end">
          <Button type="button" variant="subtle" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" variant="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply}>
            Apply
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
