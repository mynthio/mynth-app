import { ChatTreeItemType } from "../enums/chat-tree-item-type.enum";

export type ChatTreeChat = {
  type: ChatTreeItemType.CHAT;

  id: string;
  name: string;
};
