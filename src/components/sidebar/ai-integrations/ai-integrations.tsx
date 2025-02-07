import { createResource, createSignal, For } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import claudeSvg from "../../../assets/claude.svg";
import IconStack from "~icons/ph/stack";
import IconBrain from "~icons/ph/brain";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../ui/context-menu";
import { BlocksIcon, BotIcon, BrainIcon } from "lucide-solid";

export default function AiIntegrations() {
  const [aiIntegrations] = createResource(async () => {
    const integrations = await invoke("get_ai_integrations");
    return integrations as any;
  });

  return (
    <div>
      <For each={aiIntegrations()}>
        {(integration) => <Integration integration={integration} />}
      </For>
    </div>
  );
}

function Integration(props: { integration: any }) {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div>
      <button
        onClick={() => {
          setIsOpen(!isOpen());
        }}
        class="flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-sm hover:bg-stone-500/10 w-full"
      >
        <BlocksIcon size={10} />
        {props.integration.name}
      </button>

      {isOpen() && <IntegrationModels models={props.integration.models} />}
    </div>
  );
}

function IntegrationModels(props: { models: any }) {
  return (
    <div class="ml-2">
      <For fallback={"No models"} each={props.models}>
        {(model) => (
          <ContextMenu>
            <ContextMenuTrigger class="w-full">
              <button class="flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-sm hover:bg-stone-500/10 w-full">
                <BotIcon size={10} />
                {model.modelId}
              </button>
            </ContextMenuTrigger>

            <ContextMenuContent>
              <ContextMenuItem value="set_current_chat">
                Set for current chat
              </ContextMenuItem>
              <ContextMenuItem value="set_current_branch">
                Set for current branch
              </ContextMenuItem>
              <ContextMenuItem value="model_settings">
                Model settings
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
      </For>
    </div>
  );
}
