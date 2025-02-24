import { ChatTreeChat } from "./chat-tree-chat.type";
import { ChatTreeFolder } from "./chat-tree-folder.type";

export type ChatTree = (ChatTreeFolder | ChatTreeChat)[];
