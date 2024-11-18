import { createResource } from "solid-js";
import { settingsStore } from "../lib/store";

export default function SettingsPage() {
  const [settings] = createResource(async () => {
    return settingsStore.get<{ name: string }[]>("providers");
  });

  return (
    <div>
      <h1>Settings</h1>
      <pre>
        <code>{JSON.stringify(settings(), null, 2)}</code>
      </pre>
    </div>
  );
}
