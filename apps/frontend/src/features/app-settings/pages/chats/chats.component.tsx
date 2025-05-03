import { Component } from "solid-js";

/**
 * Chats settings page component
 * Contains settings for chat configuration and behavior
 */
export const ChatsSettings: Component = () => {
  return (
    <div>
      <h2 class="text-xl font-semibold mb-4">Chat Settings</h2>
      <p class="text-muted mb-6">Configure chat-related settings here.</p>

      <div class="space-y-4">
        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Chat Behavior</h3>
          <p class="text-sm text-muted">
            Configure how chats operate and respond
          </p>
        </div>

        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Message History</h3>
          <p class="text-sm text-muted">
            Configure chat history and retention preferences
          </p>
        </div>

        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Notifications</h3>
          <p class="text-sm text-muted">
            Configure chat notifications and alerts
          </p>
        </div>
      </div>
    </div>
  );
};
