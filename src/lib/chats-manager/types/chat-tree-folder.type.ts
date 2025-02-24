import { ChatTree } from "./chat-tree.type";
import { ChatTreeItemType } from "../enums/chat-tree-item-type.enum";

export interface ChatTreeFolder {
  type: ChatTreeItemType.FOLDER;

  id: string;
  name: string;

  children: ChatTree;
}
