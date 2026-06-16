import {
  autocompletion,
  startCompletion,
  type Completion,
  type CompletionContext,
} from "@codemirror/autocomplete";
import { EditorState, type Extension } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import type { RowData } from "@tanstack/react-table";
import { Badge, Group, Stack } from "@mantine/core";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import type { TableInstance } from "@/table/table-types";
import { getFormulaColumns, getFormulaReferences, type FormulaColumn } from "../formula-references";

class ColumnBadgeWidget extends WidgetType {
  private readonly column: FormulaColumn;

  constructor(column: FormulaColumn) {
    super();
    this.column = column;
  }

  eq(other: ColumnBadgeWidget) {
    return other.column.id === this.column.id && other.column.label === this.column.label;
  }

  toDOM() {
    const badge = document.createElement("span");

    badge.dataset.formulaColumnBadge = "true";
    badge.textContent = this.column.label;
    badge.title = this.column.id;
    return badge;
  }

  ignoreEvent() {
    return false;
  }
}

function createColumnBadgeDecorations(view: EditorView, columnsById: Map<string, FormulaColumn>) {
  const decorations = [];
  const pattern = /\[([^\]]+)\]/g;

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);

    for (const match of text.matchAll(pattern)) {
      const columnId = match[1]?.trim();
      const matchIndex = match.index;

      if (!columnId || matchIndex === undefined) {
        continue;
      }

      const column = columnsById.get(columnId);

      if (!column) {
        continue;
      }

      decorations.push(
        Decoration.replace({
          inclusive: false,
          widget: new ColumnBadgeWidget(column),
        }).range(from + matchIndex, from + matchIndex + match[0].length),
      );
    }
  }

  return Decoration.set(decorations, true);
}

function columnBadgeExtension(columns: FormulaColumn[]): Extension {
  const columnsById = new Map(columns.map((column) => [column.id, column]));

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = createColumnBadgeDecorations(view, columnsById);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = createColumnBadgeDecorations(update.view, columnsById);
        }
      }
    },
    {
      decorations: (value) => value.decorations,
    },
  );
}

function columnCompletionExtension(columns: FormulaColumn[]) {
  const completionSource = (context: CompletionContext) => {
    const line = context.state.doc.lineAt(context.pos);
    const beforeCursor = context.state.sliceDoc(line.from, context.pos);
    const bracketMatch = /\[[A-Za-z0-9_]*$/.exec(beforeCursor);
    const wordMatch = /[A-Za-z_][A-Za-z0-9_]*$/.exec(beforeCursor);
    const match = bracketMatch ?? wordMatch;

    if (!match) {
      return null;
    }

    const matchText = match[0];
    const from = line.from + beforeCursor.length - matchText.length;
    const query = matchText.startsWith("[") ? matchText.slice(1) : matchText;

    if (query === "" && !matchText.startsWith("[") && !context.explicit) {
      return null;
    }

    const lowerQuery = query.toLowerCase();
    const options: Completion[] = columns
      .filter(
        (column) =>
          column.id.toLowerCase().includes(lowerQuery) ||
          column.label.toLowerCase().includes(lowerQuery),
      )
      .slice(0, 12)
      .map((column) => ({
        label: column.label,
        detail: column.id,
        type: "variable",
        apply: (view, _completion, from, to) => {
          const insertValue = `[${column.id}]`;

          view.dispatch({
            changes: { from, to, insert: insertValue },
            selection: { anchor: from + insertValue.length },
          });
        },
      }));

    return {
      from,
      options,
      validFor: /^\[?[A-Za-z0-9_]*$/,
    };
  };

  return [
    autocompletion({
      activateOnTyping: true,
      override: [completionSource],
    }),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return;
      }

      const cursor = update.state.selection.main.head;
      const line = update.state.doc.lineAt(cursor);
      const beforeCursor = update.state.sliceDoc(line.from, cursor);

      if (/\[[A-Za-z0-9_]*$/.test(beforeCursor)) {
        queueMicrotask(() => startCompletion(update.view));
      }
    }),
  ];
}

function formulaEditorTheme() {
  return EditorView.theme({
    "&": {
      border: "1px solid var(--color-input)",
      borderRadius: "calc(var(--radius) - 2px)",
      backgroundColor: "color-mix(in oklab, var(--color-input) 20%, transparent)",
      fontSize: "12px",
    },
    "&.cm-focused": {
      borderColor: "var(--color-ring)",
      outline: "2px solid color-mix(in oklab, var(--color-ring) 30%, transparent)",
      outlineOffset: "0",
    },
    ".cm-content": {
      caretColor: "var(--color-foreground)",
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      minHeight: "6rem",
      padding: "0.5rem",
    },
    ".cm-editor": {
      borderRadius: "inherit",
    },
    ".cm-line": {
      lineHeight: "1.5rem",
    },
    ".cm-placeholder": {
      color: "var(--color-muted-foreground)",
    },
    ".cm-scroller": {
      borderRadius: "inherit",
      overflow: "auto",
    },
    ".cm-tooltip": {
      border: "1px solid var(--color-border)",
      borderRadius: "calc(var(--radius) - 2px)",
      backgroundColor: "var(--color-popover)",
      boxShadow: "var(--shadow-md)",
      color: "var(--color-popover-foreground)",
      overflow: "hidden",
    },
    ".cm-tooltip-autocomplete ul": {
      fontFamily: "inherit",
      padding: "0.25rem",
    },
    ".cm-tooltip-autocomplete ul li": {
      borderRadius: "calc(var(--radius) - 4px)",
      fontSize: "12px",
      minHeight: "1.75rem",
      padding: "0.25rem 0.5rem",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "var(--color-accent)",
      color: "var(--color-accent-foreground)",
    },
    "span[data-formula-column-badge='true']": {
      alignItems: "center",
      backgroundColor: "var(--color-muted)",
      border: "1px solid var(--color-border)",
      borderRadius: "calc(var(--radius) - 4px)",
      color: "var(--color-foreground)",
      display: "inline-flex",
      fontFamily: "var(--font-sans, inherit)",
      fontSize: "11px",
      fontWeight: "600",
      lineHeight: "1rem",
      margin: "0 1px",
      maxWidth: "10rem",
      overflow: "hidden",
      padding: "0 0.375rem",
      textOverflow: "ellipsis",
      verticalAlign: "middle",
      whiteSpace: "nowrap",
    },
  });
}

export function FormulaInput<TData extends RowData>({
  instance,
  onChange,
  value,
}: {
  instance: TableInstance<TData>;
  onChange: (value: string) => void;
  value: string;
}) {
  const columns = useMemo(() => getFormulaColumns(instance), [instance]);
  const references = useMemo(() => getFormulaReferences(value, columns), [columns, value]);
  const extensions = useMemo(
    () => [
      EditorState.tabSize.of(2),
      EditorView.lineWrapping,
      columnCompletionExtension(columns),
      columnBadgeExtension(columns),
      formulaEditorTheme(),
    ],
    [columns],
  );

  return (
    <Stack gap="xs">
      <CodeMirror
        aria-label="Formula"
        basicSetup={{
          bracketMatching: true,
          closeBrackets: false,
          defaultKeymap: true,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          lineNumbers: false,
          searchKeymap: false,
        }}
        extensions={extensions}
        height="auto"
        onChange={onChange}
        placeholder="[attack] + [sp_attack]"
        value={value}
      />

      {references.unknown.length === 0 ? null : (
        <Group gap={6} miw={0}>
          {references.unknown.map((reference) => (
            <Badge
              c="var(--color-destructive)"
              color="red"
              key={reference}
              maw="100%"
              size="xs"
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
              variant="light"
            >
              {reference}
            </Badge>
          ))}
        </Group>
      )}
    </Stack>
  );
}
