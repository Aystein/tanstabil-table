import type { RowData } from "@tanstack/react-table";
import type { TableInstance } from "@/table/table-types";

export type FormulaColumn = {
  id: string;
  label: string;
};

type FormulaReferences = {
  unknown: string[];
};

const formulaFunctionNames = new Set([
  "abs",
  "ceil",
  "exp",
  "floor",
  "log",
  "max",
  "min",
  "pow",
  "round",
  "sqrt",
]);

function getColumnLabel<TData extends RowData>(
  column: ReturnType<TableInstance<TData>["getAllLeafColumns"]>[number],
) {
  return typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
}

export function getFormulaColumns<TData extends RowData>(instance: TableInstance<TData>) {
  return instance
    .getAllLeafColumns()
    .filter((column) => column.columnDef.columnType === "number")
    .map((column) => ({
      id: column.id,
      label: getColumnLabel(column),
    }));
}

export function getFormulaReferences(value: string, columns: FormulaColumn[]): FormulaReferences {
  const columnIds = new Set(columns.map((column) => column.id));
  const unknown = new Set<string>();
  let formulaWithoutBrackets = value;

  for (const match of value.matchAll(/\[([^\]]*)\]/g)) {
    const reference = match[1]?.trim();

    if (!reference) {
      continue;
    }

    if (!columnIds.has(reference)) {
      unknown.add(reference);
    }

    formulaWithoutBrackets = formulaWithoutBrackets.replace(match[0], " ");
  }

  for (const match of formulaWithoutBrackets.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g)) {
    const reference = match[0];

    if (formulaFunctionNames.has(reference)) {
      continue;
    }

    if (!columnIds.has(reference)) {
      unknown.add(reference);
    }
  }

  return {
    unknown: [...unknown],
  };
}

export function getFormulaColumnReferences<TData extends RowData>(
  instance: TableInstance<TData>,
  value: string,
) {
  return getFormulaReferences(value, getFormulaColumns(instance));
}
