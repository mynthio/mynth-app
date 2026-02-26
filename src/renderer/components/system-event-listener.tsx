import { useEffect } from "react";
import { useSystemStore } from "../stores/system-store";

export function SystemEventListener() {
  const handleSystemEvent = useSystemStore((s) => s.handleSystemEvent);
  const syncState = useSystemStore((s) => s.syncState);

  useEffect(() => {
    void window.electronAPI.getSystemState().then(syncState);
    return window.electronAPI.onSystemEvent(handleSystemEvent);
  }, [handleSystemEvent, syncState]);

  return null;
}
