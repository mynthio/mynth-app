import { invoke } from "@tauri-apps/api/core";
import { useChatBranch } from "../../data/queries/chat-branches/use-chat-branch";
import { useChatBranches } from "../../data/queries/chat-branches/use-chat-branches";
import { useChat } from "../../data/queries/chats/use-chat";
import { navigationStore } from "../../stores/navigation.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { openContextMenu } from "../context-menu";
import { useQueryClient } from "@tanstack/solid-query";
import { GET_CHAT_KEYS } from "../../data/utils/query-keys";
import { Chat } from "../../types";
import { useChatBranchNodes } from "../../data/queries/chat-branch-nodes/use-chat-branch-nodes";
import {
  Accessor,
  createEffect,
  createMemo,
  For,
  onMount,
  Show,
} from "solid-js";
import dayjs from "dayjs";
import { Virtualizer, VList, VListHandle } from "virtua/solid";
import { createVirtualizer } from "@tanstack/solid-virtual";

export function ChatView() {
  const chat = useChat({
    chatId: () => navigationStore.content.id!,
  });

  const branch = useChatBranch({
    branchId: () => chat.data?.currentBranchId!,
  });

  return (
    <>
      <ChatTitleBar />

      <>
        {/* <pre>{JSON.stringify(chat.data, null, 2)}</pre>
        <pre>{JSON.stringify(branch.data, null, 2)}</pre> */}
        <Show when={branch.data?.id}>
          <Messages branchId={() => branch.data?.id!} />
        </Show>
      </>

      <div class="absolute px-14px py-16px bottom-24px gap-10px inset-x-0 mx-auto flex flex-col justify-between bg-gradient-to-bl backdrop-blur-88px from-[#919C98]/5 via-[#B7C8C2]/5 to-[#677C74]/5 rounded-22px shadow-2xl shadow-[#000]/15 max-w-700px">
        <div
          class="grid
    text-sm
    after:px-3.5
    after:py-2.5
    [&>textarea]:text-inherit
    after:text-inherit
    [&>textarea]:resize-none
    [&>textarea]:overflow-hidden
    [&>textarea]:[grid-area:1/1/2/2]
    after:[grid-area:1/1/2/2]
    after:whitespace-pre-wrap
    after:invisible
    after:content-[attr(data-cloned-val)_'_']"
        >
          <textarea
            class="w-full text-body bg-transparent appearance-none rounded px-3.5 py-2.5 outline-none"
            // @ts-ignore
            onInput="this.parentNode.dataset.clonedVal = this.value"
            placeholder="Your message is my command"
          />
        </div>
        <div class="flex items-end justify-between">
          <div>
            <button class="flex items-center gap-4px text-12px text-accent bg-accent/10 rounded-12px px-16px h-32px hover:scale-103 transition-all transition-duration-300 cursor-default active:scale-101">
              <div class="i-lucide:brain text-11px" />
              <span>Hyperbolic / Llama 3.3. 70B</span>
            </button>
          </div>
          <div>
            <button class="flex items-center justify-center gap-4px text-12px text-accent bg-accent/10 rounded-12px w-36px h-36px cursor-default hover:scale-105 hover:translate-y-[-6px] transition-all transition-duration-300">
              <div class="i-lucide:arrow-up text-15px" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ChatTitleBar() {
  const chat = useChat({
    chatId: () => navigationStore.content.id!,
  });

  return (
    <div class="w-full flex justify-between items-center h-top-bar px-14px fixed top-0 z-50 bg-background/10 backdrop-blur-32px">
      <div
        class="flex items-center gap-6px text-muted"
        onContextMenu={openContextMenu("chat", {
          id: chat.data?.id!,
        })}
      >
        <div class="i-lucide:message-circle text-11px" />
        <span class="text-14px">{chat.data?.name}</span>
      </div>

      <div class="flex items-center gap-12px text-muted">
        <ChatBranchesDropdownMenu />
        <button>
          <div class="i-lucide:settings text-12px" />
        </button>
      </div>
    </div>
  );
}

function ChatBranchesDropdownMenu() {
  const queryClient = useQueryClient();

  const branches = useChatBranches({
    chatId: () => navigationStore.content.id!,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div class="i-lucide:git-branch text-12px" />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {branches.data?.map((branch) => (
          <DropdownMenuItem
            onSelect={() => {
              invoke("update_chat", {
                chatId: navigationStore.content.id!,
                params: {
                  currentBranchId: branch.id,
                },
              }).then(() => {
                queryClient.setQueryData<Chat>(
                  GET_CHAT_KEYS({
                    chatId: () => navigationStore.content.id!,
                  }),
                  (currentChatData) =>
                    currentChatData
                      ? {
                          ...currentChatData,
                          currentBranchId: branch.id,
                        }
                      : undefined
                );
              });
            }}
          >
            <span>{branch.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Messages({ branchId }: { branchId: Accessor<string> }) {
  let virtualListRef: VListHandle | null = null;

  const nodes = useChatBranchNodes({
    branchId: branchId,
  });

  createEffect(() => {
    console.log(
      virtualListRef,
      nodes.data?.pages.flatMap((page) => page.nodes)
    );
    virtualListRef?.scrollToIndex(
      nodes.data?.pages.flatMap((page) => page.nodes).length - 1,
      { align: "end" }
    );
  }, nodes.data);

  const items = createMemo(
    () => nodes.data?.pages.flatMap((page) => page.nodes) ?? []
  );

  return (
    <VList
      ref={(h) => {
        virtualListRef = h;
      }}
      shift
      data={items()}
      overscan={8}
      class="size-full scrollbar scrollbar-track-color-transparent scrollbar-thumb-color-accent/50 scrollbar-rounded scrollbar-w-3px scrollbar-h-3px scrollbar-radius-2 scrollbar-track-radius-4 scrollbar-thumb-radius-4"
    >
      {(node) => (
        <div class="bg-accent/10 rounded-12px p-4px my-10px">
          {node.id} | {node.nodeType} |{" "}
          {dayjs(node.createdAt).format("DD-MM HH:mm")}
          <br />
          <div innerHTML={node.activeVersion?.content} />
        </div>
      )}
    </VList>

    // <div class="space-y-24px w-full px-32px">
    //   <For each={nodes.data?.pages}>
    //     {(page) => (
    //       <For each={page.nodes}>
    //         {(node) => (
    //           <div
    //             class="flex items-center"
    //             classList={{
    //               "justify-end": node.nodeType.startsWith("user"),
    //             }}
    //           >
    //             <div class="bg-accent/10 rounded-12px p-4px">
    //               {node.nodeType} |{" "}
    //               {dayjs(node.createdAt).format("DD-MM HH:mm")}
    //               <div
    //                 innerHTML={node.activeVersion?.content}
    //                 class="prose prose-sm px-16px py-12px"
    //               />
    //             </div>
    //           </div>
    //         )}
    //       </For>
    //     )}
    //   </For>
    // </div>
  );
}
