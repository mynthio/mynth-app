import { Hono } from "hono";
import { streamText, convertToModelMessages, generateId } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { parseChatId } from "../../../shared/chat/chat-id";
import {
  normalizeChatMessageMetadata,
  type MynthUiMessage,
} from "../../../shared/chat/message-metadata";
import { getChatById } from "../../chat-tree/repository";
import { upsertMessage } from "../../messages/repository";
import { getModelById } from "../../models/repository";
import { getProviderById } from "../../providers/repository";
import { resolveProviderRuntimeContext } from "../../providers/runtime-config";

export function createChatRoute() {
  const app = new Hono();

  app.post("/api/chat", async (c) => {
    const body = await c.req.json();
    const messages: MynthUiMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const modelId: string | undefined = body.modelId;
    const requestChatId = typeof body.chatId === "string" ? body.chatId : undefined;
    const parsedChatId = parseChatId(requestChatId);

    if (!modelId) {
      return c.json({ error: "modelId is required" }, 400);
    }

    if (!parsedChatId.ok) {
      return c.json({ error: "chatId is required" }, 400);
    }

    const chat = getChatById(parsedChatId.value);
    if (!chat) {
      return c.json({ error: "Chat not found" }, 400);
    }

    const model = getModelById(modelId);
    if (!model || !model.isEnabled) {
      return c.json({ error: "Model not found or not enabled" }, 400);
    }

    const provider = getProviderById(model.providerId);
    if (!provider) {
      return c.json({ error: "Model not found or not enabled" }, 400);
    }

    let apiKey: string;
    try {
      const { parsedConfig } = resolveProviderRuntimeContext(provider);
      apiKey = parsedConfig.apiKey;
    } catch {
      return c.json({ error: "Model not found or not enabled" }, 400);
    }

    if (!apiKey) {
      return c.json({ error: "Model not found or not enabled" }, 400);
    }

    const openrouter = createOpenRouter({ apiKey });
    const lastRequestMessage = messages.at(-1);
    const assistantParentId = lastRequestMessage?.id ?? null;

    if (lastRequestMessage?.role === "user") {
      const parentId = lastRequestMessage.metadata?.parentId ?? null;

      upsertMessage({
        id: lastRequestMessage.id,
        chatId: chat.id,
        parentId,
        role: "user",
        parts: lastRequestMessage.parts,
        metadata: { parentId },
      });
    }

    const result = streamText({
      model: openrouter(model.providerModelId),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      generateMessageId: generateId,
      messageMetadata: ({ part }) => {
        if (part.type !== "start" && part.type !== "finish") {
          return undefined;
        }

        return {
          parentId: assistantParentId,
        };
      },
      onFinish: ({ responseMessage }) => {
        if (responseMessage.role !== "assistant") {
          return;
        }

        const parentId = normalizeChatMessageMetadata(
          responseMessage.metadata,
          assistantParentId,
        ).parentId;

        upsertMessage({
          id: responseMessage.id,
          chatId: chat.id,
          parentId,
          role: "assistant",
          parts: responseMessage.parts,
          metadata: { parentId },
        });
      },
    });
  });

  return app;
}
