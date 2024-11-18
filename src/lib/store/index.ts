import { LazyStore } from "@tauri-apps/plugin-store";

export const settingsStore = new LazyStore("settings.json");
