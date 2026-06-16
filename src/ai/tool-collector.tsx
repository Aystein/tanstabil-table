import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { tool, type FlexibleSchema, type InferSchema, type Tool, type ToolSet } from "ai";
import { z } from "zod";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

type ToolFunction<TInput, TOutput> = (input: TInput) => TOutput | Promise<TOutput>;

type ToolRegistrationBase = {
  id: string;
  name: string;
  description?: string;
};

export type ToolRegistration<
  TInput = Record<string, never>,
  TOutput = unknown,
> = ToolRegistrationBase & {
  inputSchema?: FlexibleSchema<TInput>;
  outputSchema?: FlexibleSchema<TOutput>;
  fn: ToolFunction<TInput, TOutput>;
};

export type ToolRegistrationWithSchemas<
  TInputSchema extends FlexibleSchema,
  TOutputSchema extends FlexibleSchema,
> = ToolRegistrationBase & {
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  fn: ToolFunction<InferSchema<TInputSchema>, InferSchema<TOutputSchema>>;
};

export type ToolRegistrationWithInputSchema<
  TInputSchema extends FlexibleSchema,
  TOutput = unknown,
> = ToolRegistrationBase & {
  inputSchema: TInputSchema;
  outputSchema?: undefined;
  fn: ToolFunction<InferSchema<TInputSchema>, TOutput>;
};

export type ToolRegistrationWithSchema<
  TInputSchema extends FlexibleSchema,
  TOutput = unknown,
> = ToolRegistrationWithInputSchema<TInputSchema, TOutput>;

export type ToolRegistrationWithOutputSchema<TOutputSchema extends FlexibleSchema> =
  ToolRegistrationBase & {
    inputSchema?: undefined;
    outputSchema: TOutputSchema;
    fn: ToolFunction<Record<string, never>, InferSchema<TOutputSchema>>;
  };

export type ToolRegistrationWithoutSchemas<TOutput = unknown> = ToolRegistrationBase & {
  inputSchema?: undefined;
  outputSchema?: undefined;
  fn: ToolFunction<Record<string, never>, TOutput>;
};

export type ToolRegistrationWithoutSchema<TOutput = unknown> = ToolRegistrationBase & {
  inputSchema?: undefined;
  outputSchema?: undefined;
  fn: ToolFunction<Record<string, never>, TOutput>;
};

type AnyToolRegistration = ToolRegistrationBase & {
  inputSchema?: FlexibleSchema;
  outputSchema?: FlexibleSchema;
  fn: ToolFunction<any, unknown>;
};

type ToolRef = {
  current: AnyToolRegistration;
};

type ToolCollectorState = {
  toolRefs: Map<string, ToolRef>;
  registerTool: (definition: AnyToolRegistration) => void;
  setTool: (definition: AnyToolRegistration) => void;
  unregisterTool: (id: string) => void;
  getToolDefinitions: () => AnyToolRegistration[];
  getAiSdkTools: () => ToolSet;
};

type ToolCollectorStore = StoreApi<ToolCollectorState>;

const emptyInputSchema = z.object({});
const ToolCollectorContext = createContext<ToolCollectorStore | null>(null);

function toAiSdkTool(definition: AnyToolRegistration): Tool<any, any> {
  return tool({
    description: definition.description ?? definition.name,
    inputSchema: definition.inputSchema ?? emptyInputSchema,
    outputSchema: definition.outputSchema,
    execute: (input) => definition.fn(input),
  });
}

export function createToolCollectorStore() {
  return createStore<ToolCollectorState>((set, get) => ({
    toolRefs: new Map(),
    registerTool: (definition) => {
      set((state) => {
        const toolRefs = new Map(state.toolRefs);
        const existing = toolRefs.get(definition.id);

        if (existing) {
          existing.current = definition;
        } else {
          toolRefs.set(definition.id, { current: definition });
        }

        return { toolRefs };
      });
    },
    setTool: (definition) => {
      const existing = get().toolRefs.get(definition.id);

      if (existing) {
        existing.current = definition;
        return;
      }

      get().registerTool(definition);
    },
    unregisterTool: (id) => {
      set((state) => {
        if (!state.toolRefs.has(id)) {
          return state;
        }

        const toolRefs = new Map(state.toolRefs);
        toolRefs.delete(id);
        return { toolRefs };
      });
    },
    getToolDefinitions: () => {
      return Array.from(get().toolRefs.values()).map((toolRef) => toolRef.current);
    },
    getAiSdkTools: () => {
      const tools: ToolSet = {};

      for (const toolRef of get().toolRefs.values()) {
        const definition = toolRef.current;
        tools[definition.name] = toAiSdkTool(definition);
      }

      return tools;
    },
  }));
}

export function ToolCollectorProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ToolCollectorStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createToolCollectorStore();
  }

  return (
    <ToolCollectorContext.Provider value={storeRef.current}>
      {children}
    </ToolCollectorContext.Provider>
  );
}

export function useToolCollectorStoreApi() {
  const store = useContext(ToolCollectorContext);

  if (!store) {
    throw new Error("useToolCollectorStoreApi must be used inside ToolCollectorProvider");
  }

  return store;
}

export function useToolCollectorStore<T>(selector: (state: ToolCollectorState) => T) {
  return useStore(useToolCollectorStoreApi(), selector);
}

export function useRegisterTool<
  TInputSchema extends FlexibleSchema,
  TOutputSchema extends FlexibleSchema,
>(definition: ToolRegistrationWithSchemas<TInputSchema, TOutputSchema>): void;
export function useRegisterTool<TInputSchema extends FlexibleSchema, TOutput = unknown>(
  definition: ToolRegistrationWithInputSchema<TInputSchema, TOutput>,
): void;
export function useRegisterTool<TOutputSchema extends FlexibleSchema>(
  definition: ToolRegistrationWithOutputSchema<TOutputSchema>,
): void;
export function useRegisterTool<TOutput = unknown>(
  definition: ToolRegistrationWithoutSchemas<TOutput>,
): void;
export function useRegisterTool(definition: AnyToolRegistration) {
  const store = useToolCollectorStoreApi();

  useEffect(() => {
    store.getState().registerTool(definition);

    return () => {
      store.getState().unregisterTool(definition.id);
    };
  }, [definition.id, store]);

  useEffect(() => {
    store.getState().setTool(definition);
  });
}
