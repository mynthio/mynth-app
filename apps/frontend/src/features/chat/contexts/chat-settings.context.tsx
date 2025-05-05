import { createStore } from 'solid-js/store'

import {
  Accessor,
  JSX,
  createContext,
  createEffect,
  createMemo,
  useContext,
} from 'solid-js'

import { getChatBranchNodes } from '../../../data/api/chat-branch-nodes/get-chat-branch-nodes'
import { ChatNode } from '../../../types'

type PromptMode = 'floating' | 'docked'

type PromptSettings = {
  mode: PromptMode
  height: number
}

type ChatSettingsContextState = {
  prompt: PromptSettings
}

type ChatSettingsContext = {
  prompt: Accessor<PromptSettings>
  setPromptMode: (mode: PromptMode) => void
}

const ChatSettingsContext = createContext<ChatSettingsContext>({
  prompt: () => ({
    mode: 'floating' as const,
    height: 0,
  }),
  setPromptMode: () => {},
})

type ChatSettingsContextProviderProps = {
  children: JSX.Element
}

export function ChatSettingsContextProvider(
  props: ChatSettingsContextProviderProps
) {
  const [state, setState] = createStore<ChatSettingsContextState>({
    prompt: {
      mode: 'floating',
      height: 0,
    },
  })

  const prompt = createMemo(() => state.prompt)

  const setPromptMode = (mode: PromptMode) => {
    setState('prompt', 'mode', mode)
  }

  const value = {
    prompt,
    setPromptMode,
  }

  return (
    <ChatSettingsContext.Provider value={value}>
      {props.children}
    </ChatSettingsContext.Provider>
  )
}

export function useChatSettings() {
  const context = useContext(ChatSettingsContext)
  if (!context) {
    throw new Error(
      'useChatSettings must be used within a ChatSettingsContextProvider'
    )
  }
  return context
}
