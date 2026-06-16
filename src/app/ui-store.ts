import { create } from "zustand";

export const dashboardViewTypes = ["table", "scatterPlot", "violinPlot"] as const;
export const dashboardLayoutDirections = ["horizontal", "vertical"] as const;
export const dashboardSplitPlacements = ["before", "after"] as const;

export type DashboardViewType = (typeof dashboardViewTypes)[number];
export type DashboardLayoutDirection = (typeof dashboardLayoutDirections)[number];
export type DashboardSplitPlacement = (typeof dashboardSplitPlacements)[number];

export type DashboardViewNode = {
  id: string;
  kind: "view";
  type: DashboardViewType;
  title: string;
  size: number;
};

export type DashboardGroupNode = {
  id: string;
  kind: "group";
  direction: DashboardLayoutDirection;
  children: DashboardLayoutNode[];
  size: number;
};

export type DashboardLayoutNode = DashboardGroupNode | DashboardViewNode;
export type DashboardPane = DashboardViewNode;

export type DashboardViewInput = Partial<Pick<DashboardViewNode, "id" | "title" | "size">> & {
  kind?: "view";
  type: DashboardViewType;
};

export type DashboardGroupInput = Partial<Pick<DashboardGroupNode, "id" | "size">> & {
  kind: "group";
  direction: DashboardLayoutDirection;
  children: DashboardLayoutInput[];
};

export type DashboardLayoutInput = DashboardGroupInput | DashboardViewInput;

type UiState = {
  activeDashboardPaneId: string;
  dashboardLayout: DashboardLayoutNode;
  dashboardLayoutVersion: number;
  isChatOpen: boolean;
  isSettingsOpen: boolean;
  addDashboardPane: (type: DashboardViewType, title?: string) => DashboardPane;
  removeDashboardPane: (paneId: string) => void;
  setActiveDashboardPaneId: (paneId: string) => void;
  setChatOpen: (isOpen: boolean) => void;
  setDashboardGroupSizes: (groupId: string, sizesByNodeId: Record<string, number>) => void;
  setDashboardLayout: (layout: DashboardLayoutInput, activePaneId?: string) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  splitDashboardPane: (options: {
    direction: DashboardLayoutDirection;
    paneId: string;
    placement?: DashboardSplitPlacement;
    view: DashboardViewInput;
  }) => DashboardPane | null;
  updateDashboardPane: (
    paneId: string,
    patch: Partial<Pick<DashboardPane, "type" | "title" | "size">>,
  ) => void;
};

const defaultTitles: Record<DashboardViewType, string> = {
  table: "Table",
  scatterPlot: "Scatter Plot",
  violinPlot: "Violin Plot",
};

const defaultDashboardLayout: DashboardLayoutNode = {
  id: "table",
  kind: "view",
  type: "table",
  title: "Table",
  size: 100,
};

function isGroupInput(node: DashboardLayoutInput): node is DashboardGroupInput {
  return node.kind === "group";
}

function toKebabCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function createNodeId(prefix: string, existingIds: Set<string>) {
  let index = 1;
  let id = prefix;

  while (existingIds.has(id)) {
    index += 1;
    id = `${prefix}-${index}`;
  }

  existingIds.add(id);
  return id;
}

function collectNodeIds(node: DashboardLayoutNode, ids = new Set<string>()) {
  ids.add(node.id);

  if (node.kind === "group") {
    for (const child of node.children) {
      collectNodeIds(child, ids);
    }
  }

  return ids;
}

export function getDashboardPanes(node: DashboardLayoutNode): DashboardPane[] {
  if (node.kind === "view") {
    return [node];
  }

  return node.children.flatMap((child) => getDashboardPanes(child));
}

function normalizeSiblingSizes<T extends DashboardLayoutNode>(nodes: T[]): T[] {
  if (!nodes.length) {
    return nodes;
  }

  const fallbackSize = 100 / nodes.length;
  const total = nodes.reduce((sum, node) => {
    return sum + (Number.isFinite(node.size) && node.size > 0 ? node.size : fallbackSize);
  }, 0);

  if (total <= 0) {
    return nodes.map((node) => ({ ...node, size: fallbackSize }));
  }

  return nodes.map((node) => ({
    ...node,
    size: ((Number.isFinite(node.size) && node.size > 0 ? node.size : fallbackSize) / total) * 100,
  }));
}

function normalizeLayoutNode(
  input: DashboardLayoutInput,
  existingIds: Set<string>,
): DashboardLayoutNode {
  if (isGroupInput(input)) {
    const children = input.children.length ? input.children : [defaultDashboardLayout];
    const id =
      input.id && !existingIds.has(input.id) ? input.id : createNodeId("group", existingIds);

    existingIds.add(id);

    return {
      id,
      kind: "group",
      direction: input.direction,
      size: input.size ?? 100,
      children: normalizeSiblingSizes(
        children.map((child) => normalizeLayoutNode(child, existingIds)),
      ),
    };
  }

  const id =
    input.id && !existingIds.has(input.id)
      ? input.id
      : createNodeId(toKebabCase(input.type), existingIds);

  existingIds.add(id);

  return {
    id,
    kind: "view",
    type: input.type,
    title: input.title?.trim() || defaultTitles[input.type],
    size: input.size ?? 100,
  };
}

function normalizeLayout(input: DashboardLayoutInput) {
  const normalized = normalizeLayoutNode(input, new Set<string>());

  return {
    ...normalized,
    size: 100,
  };
}

function findFirstPaneId(node: DashboardLayoutNode) {
  return getDashboardPanes(node)[0]?.id ?? defaultDashboardLayout.id;
}

function layoutHasPane(node: DashboardLayoutNode, paneId: string) {
  return getDashboardPanes(node).some((pane) => pane.id === paneId);
}

function updateNode(
  node: DashboardLayoutNode,
  nodeId: string,
  update: (node: DashboardLayoutNode) => DashboardLayoutNode,
): DashboardLayoutNode {
  if (node.id === nodeId) {
    return update(node);
  }

  if (node.kind === "view") {
    return node;
  }

  return {
    ...node,
    children: node.children.map((child) => updateNode(child, nodeId, update)),
  };
}

function splitPaneNode(
  node: DashboardLayoutNode,
  paneId: string,
  direction: DashboardLayoutDirection,
  placement: DashboardSplitPlacement,
  view: DashboardViewNode,
  groupId: string,
): { layout: DashboardLayoutNode; didSplit: boolean } {
  if (node.kind === "view") {
    if (node.id !== paneId) {
      return { layout: node, didSplit: false };
    }

    const first = { ...node, size: 50 };
    const second = { ...view, size: 50 };

    return {
      didSplit: true,
      layout: {
        id: groupId,
        kind: "group",
        direction,
        size: node.size,
        children: placement === "before" ? [second, first] : [first, second],
      },
    };
  }

  const children: DashboardLayoutNode[] = [];
  let didSplit = false;

  for (const child of node.children) {
    if (didSplit) {
      children.push(child);
      continue;
    }

    const result = splitPaneNode(child, paneId, direction, placement, view, groupId);
    didSplit = result.didSplit;
    children.push(result.layout);
  }

  return {
    didSplit,
    layout: {
      ...node,
      children: normalizeSiblingSizes(children),
    },
  };
}

function removePaneNode(
  node: DashboardLayoutNode,
  paneId: string,
): { layout: DashboardLayoutNode | null; didRemove: boolean } {
  if (node.kind === "view") {
    return node.id === paneId
      ? { layout: null, didRemove: true }
      : { layout: node, didRemove: false };
  }

  let didRemove = false;
  const children: DashboardLayoutNode[] = [];

  for (const child of node.children) {
    const result = removePaneNode(child, paneId);
    didRemove = didRemove || result.didRemove;

    if (result.layout) {
      children.push(result.layout);
    }
  }

  if (!children.length) {
    return { layout: null, didRemove };
  }

  if (children.length === 1) {
    return { layout: { ...children[0]!, size: node.size }, didRemove };
  }

  return {
    didRemove,
    layout: {
      ...node,
      children: normalizeSiblingSizes(children),
    },
  };
}

function createViewNode(input: DashboardViewInput, existingIds: Set<string>): DashboardViewNode {
  const node = normalizeLayoutNode(input, existingIds);

  if (node.kind === "group") {
    throw new Error("Expected a dashboard view node.");
  }

  return node;
}

export const useUiStore = create<UiState>((set, get) => ({
  activeDashboardPaneId: defaultDashboardLayout.id,
  dashboardLayout: defaultDashboardLayout,
  dashboardLayoutVersion: 0,
  isChatOpen: true,
  isSettingsOpen: false,
  addDashboardPane: (type, title) => {
    const layout = get().dashboardLayout;
    const activePaneId = layoutHasPane(layout, get().activeDashboardPaneId)
      ? get().activeDashboardPaneId
      : findFirstPaneId(layout);

    return get().splitDashboardPane({
      paneId: activePaneId,
      direction: "horizontal",
      placement: "after",
      view: { type, title },
    })!;
  },
  removeDashboardPane: (paneId) => {
    set((state) => {
      if (getDashboardPanes(state.dashboardLayout).length === 1) {
        return state;
      }

      const result = removePaneNode(state.dashboardLayout, paneId);

      if (!result.didRemove || !result.layout) {
        return state;
      }

      const dashboardLayout = { ...result.layout, size: 100 };
      const activeDashboardPaneId =
        state.activeDashboardPaneId === paneId
          ? findFirstPaneId(dashboardLayout)
          : state.activeDashboardPaneId;

      return {
        activeDashboardPaneId,
        dashboardLayout,
        dashboardLayoutVersion: state.dashboardLayoutVersion + 1,
      };
    });
  },
  setActiveDashboardPaneId: (paneId) => {
    if (layoutHasPane(get().dashboardLayout, paneId)) {
      set({ activeDashboardPaneId: paneId });
    }
  },
  setChatOpen: (isChatOpen) => set({ isChatOpen }),
  setDashboardGroupSizes: (groupId, sizesByNodeId) => {
    set((state) => {
      let changed = false;
      const dashboardLayout = updateNode(state.dashboardLayout, groupId, (node) => {
        if (node.kind === "view") {
          return node;
        }

        const children = node.children.map((child) => {
          const size = sizesByNodeId[child.id];

          if (size === undefined || Math.abs(size - child.size) <= 0.01) {
            return child;
          }

          changed = true;
          return { ...child, size };
        });

        return { ...node, children };
      });

      return changed ? { dashboardLayout } : state;
    });
  },
  setDashboardLayout: (layout, activePaneId) => {
    const dashboardLayout = normalizeLayout(layout);
    const activeDashboardPaneId =
      activePaneId && layoutHasPane(dashboardLayout, activePaneId)
        ? activePaneId
        : findFirstPaneId(dashboardLayout);

    set((state) => ({
      activeDashboardPaneId,
      dashboardLayout,
      dashboardLayoutVersion: state.dashboardLayoutVersion + 1,
    }));
  },
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  splitDashboardPane: ({ direction, paneId, placement = "after", view }) => {
    let newPane: DashboardPane | null = null;

    set((state) => {
      const newPaneIds = collectNodeIds(state.dashboardLayout);
      const nextPane = createViewNode(view, newPaneIds);
      const groupId = createNodeId(`split-${paneId}`, newPaneIds);
      const result = splitPaneNode(
        state.dashboardLayout,
        paneId,
        direction,
        placement,
        nextPane,
        groupId,
      );

      if (!result.didSplit) {
        return state;
      }

      newPane = nextPane;

      return {
        activeDashboardPaneId: nextPane.id,
        dashboardLayout: { ...result.layout, size: 100 },
        dashboardLayoutVersion: state.dashboardLayoutVersion + 1,
      };
    });

    return newPane;
  },
  updateDashboardPane: (paneId, patch) => {
    set((state) => {
      let changed = false;
      const dashboardLayout = updateNode(state.dashboardLayout, paneId, (node) => {
        if (node.kind === "group") {
          return node;
        }

        changed = true;
        return {
          ...node,
          ...patch,
          title: patch.title?.trim() || node.title,
        };
      });

      if (!changed) {
        return state;
      }

      return {
        dashboardLayout,
        dashboardLayoutVersion:
          patch.type !== undefined || patch.size !== undefined
            ? state.dashboardLayoutVersion + 1
            : state.dashboardLayoutVersion,
      };
    });
  },
}));
