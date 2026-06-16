import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const apiKeyStorageKey = "ultra-grid.openai-api-key";
const defaultModel = "gpt-4.1-mini";

type AiSettingsContextValue = {
  apiKey: string;
  model: string;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
};

const AiSettingsContext = createContext<AiSettingsContextValue | null>(null);

export function AiSettingsProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(apiKeyStorageKey) ?? "");
  const [model, setModel] = useState(defaultModel);

  useEffect(() => {
    localStorage.setItem(apiKeyStorageKey, apiKey);
  }, [apiKey]);

  const value = useMemo(
    () => ({
      apiKey,
      model,
      setApiKey,
      setModel,
    }),
    [apiKey, model],
  );

  return <AiSettingsContext.Provider value={value}>{children}</AiSettingsContext.Provider>;
}

export function useAiSettings() {
  const context = useContext(AiSettingsContext);

  if (!context) {
    throw new Error("useAiSettings must be used inside AiSettingsProvider");
  }

  return context;
}
