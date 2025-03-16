import { Accessor } from "solid-js";
import { getWorkspace } from "../../api/workspaces/get-workspace";
import { createQuery } from "@tanstack/solid-query";
import { GET_WORKSPACE_BY_ID_KEYS } from "../../utils/query-keys";

interface UseWorkspaceProps {
  workspaceId: Accessor<string>;
}

export const useWorkspace = ({ workspaceId }: UseWorkspaceProps) => {
  return createQuery(() => ({
    queryKey: GET_WORKSPACE_BY_ID_KEYS({ workspaceId }),
    queryFn: () => getWorkspace(workspaceId()),
  }));
};
