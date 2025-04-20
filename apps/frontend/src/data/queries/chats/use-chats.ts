import { Accessor } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { GET_CHATS_KEYS } from "../../utils/query-keys";
import { getChats } from "../../api/chats/get-chats";

interface UseChatsProps {
  workspaceId: Accessor<string>;
}

export const useChats = ({ workspaceId }: UseChatsProps) => {
  return createQuery(() => ({
    queryKey: GET_CHATS_KEYS({ workspaceId }),
    queryFn: () => getChats(workspaceId()),
  }));
};
