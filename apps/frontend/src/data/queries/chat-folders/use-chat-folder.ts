import { Accessor } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { GET_CHAT_FOLDER_KEYS } from "../../utils/query-keys";
import { getChatFolder } from "../../api/chat-folders/get-chat-folder";

interface UseChatFolderProps {
  folderId: Accessor<string>;
}

export function useChatFolder({ folderId }: UseChatFolderProps) {
  return useQuery(() => ({
    queryKey: GET_CHAT_FOLDER_KEYS({ folderId }),
    queryFn: () => getChatFolder(folderId()),
  }));
}
