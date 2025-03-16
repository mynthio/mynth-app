import { invoke } from "@tauri-apps/api/core";
import { Workspace } from "../../../types";

export function getWorkspaces() {
  console.debug("[api|getWorkspaces]");
  return invoke<Workspace[]>("get_workspaces");
}
