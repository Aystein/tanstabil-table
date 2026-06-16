import { Alert, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import type { TableInstance } from "@/table/table-types";
import { createFormulaEvaluator } from "../formula";
import { getFormulaColumnReferences } from "../formula-references";
import { FormulaInput } from "./formula-input";

function toColumnId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getUniqueColumnId<TData extends RowData>(instance: TableInstance<TData>, value: string) {
  const existingIds = new Set(instance.getAllLeafColumns().map((column) => column.id));
  const baseId = toColumnId(value) || "computed";
  let nextId = baseId;
  let index = 2;

  while (existingIds.has(nextId)) {
    nextId = `${baseId}_${index}`;
    index += 1;
  }

  return nextId;
}

export function ComputedColumnDialog<TData extends RowData>({
  instance,
  open,
  onOpenChange,
  tourMode = false,
}: {
  instance: TableInstance<TData>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourMode?: boolean;
}) {
  const [name, setName] = useState("");
  const [formula, setFormula] = useState("");
  const [error, setError] = useState<string | undefined>();

  const columnId = useMemo(() => getUniqueColumnId(instance, name), [instance, name]);
  const canApply = name.trim() !== "" && formula.trim() !== "";

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(tourMode ? "Power Score" : "");
    setFormula(tourMode ? "[attack] + [defense]" : "");
    setError(undefined);
  }, [open, tourMode]);

  function handleApply() {
    if (!canApply) {
      setError("Name and formula are required.");
      return;
    }

    try {
      createFormulaEvaluator(formula);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid formula.");
      return;
    }

    const references = getFormulaColumnReferences(instance, formula);

    if (references.unknown.length > 0) {
      setError(`Unknown column reference "${references.unknown[0]}".`);
      return;
    }

    instance.setComputedColumns((previous) => [
      ...previous,
      {
        id: columnId,
        header: name.trim(),
        formula: formula.trim(),
      },
    ]);
    onOpenChange(false);
  }

  return (
    <Modal
      centered
      onClose={() => onOpenChange(false)}
      opened={open}
      size="28rem"
      title="Computed column"
    >
      <Stack gap="md">
        <Text c="dimmed" size="xs">
          Add a numeric formula column.
        </Text>

        <TextInput
          autoFocus
          data-computed-column-name="true"
          label="Name"
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          placeholder="Power score"
          size="xs"
          value={name}
        />

        <Stack gap={6}>
          <Text fw={500} size="xs">
            Formula
          </Text>
          <Stack data-computed-column-formula="true">
            <FormulaInput
              instance={instance}
              onChange={(nextFormula) => {
                setFormula(nextFormula);
                setError(undefined);
              }}
              value={formula}
            />
          </Stack>
        </Stack>

        {name.trim() === "" ? null : (
          <Text c="dimmed" size="11px" truncate>
            Column id: {columnId}
          </Text>
        )}

        {error === undefined ? null : (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        <Group gap="xs" justify="flex-end">
          <Button type="button" variant="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            data-computed-column-add="true"
            disabled={!canApply}
            onClick={handleApply}
            type="button"
          >
            Add
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
