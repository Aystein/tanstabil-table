import { useState, type FormEvent } from "react";
import { Box, Button, Divider, Group, Stack, Text, Textarea, Title } from "@mantine/core";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import { SendIcon } from "lucide-react";
import { useToolCollectorStore, useToolCollectorStoreApi } from "./tool-collector";
import { useAiSettings } from "./ai-settings";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function AiChat() {
  const store = useToolCollectorStoreApi();
  const toolCount = useToolCollectorStore((state) => state.toolRefs.size);
  const { apiKey, model } = useAiSettings();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    const trimmedApiKey = apiKey.trim();
    const trimmedModel = model.trim();

    if (!trimmedPrompt || !trimmedApiKey || !trimmedModel || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedPrompt,
    };

    setMessages((current) => [...current, userMessage]);
    setPrompt("");
    setIsSending(true);

    try {
      const openai = createOpenAI({ apiKey: trimmedApiKey });
      const result = await generateText({
        model: openai(trimmedModel),
        prompt: trimmedPrompt,
        system:
          "You are helping inspect and configure the current grid UI. Use the available tools when the user asks about live table state or dashboard layout. The AI chat sidebar is separate from the dashboard panes.",
        tools: store.getState().getAiSdkTools(),
        stopWhen: stepCountIs(4),
      });

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.text || "Done.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: getErrorMessage(error),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Box
      component="section"
      bg="var(--color-background)"
      h="100%"
      mih={0}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Group
        h={44}
        justify="space-between"
        px="sm"
        style={{ borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}
      >
        <Title order={2} size="sm">
          AI Chat
        </Title>
        <Text c="dimmed" size="xs">
          {toolCount} tools
        </Text>
      </Group>

      <Stack gap="sm" mih={0} p="sm" style={{ flex: "1 1 0" }}>
        <Box
          bg="color-mix(in oklab, var(--color-muted) 30%, transparent)"
          mih={0}
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            flex: "1 1 0",
            overflow: "auto",
          }}
        >
          {messages.length ? (
            <Stack gap={0}>
              {messages.map((message) => (
                <Box key={message.id}>
                  <Stack gap={4} px="sm" py="xs">
                    <Text c="dimmed" fw={500} size="xs">
                      {message.role}
                    </Text>
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                      {message.content}
                    </Text>
                  </Stack>
                  <Divider />
                </Box>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" px="sm" py="xs" size="sm">
              Ask about the current grid.
            </Text>
          )}
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          style={{ display: "flex", flexShrink: 0, gap: "0.5rem" }}
        >
          <Textarea
            autosize={false}
            minRows={3}
            placeholder="Prompt"
            resize="none"
            value={prompt}
            style={{ flex: "1 1 0" }}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <Button type="submit" disabled={isSending} h="auto" style={{ alignSelf: "stretch" }}>
            <SendIcon size={14} />
            {isSending ? "Sending" : "Send"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
