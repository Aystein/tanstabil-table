import { Modal, Stack, TextInput } from "@mantine/core";
import { useAiSettings } from "@/ai";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { apiKey, model, setApiKey, setModel } = useAiSettings();

  return (
    <Modal centered opened={open} size="md" title="Settings" onClose={() => onOpenChange(false)}>
      <Stack gap="sm">
        <TextInput
          autoComplete="off"
          label="SDK key"
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
        <TextInput label="Model" value={model} onChange={(event) => setModel(event.target.value)} />
      </Stack>
    </Modal>
  );
}
