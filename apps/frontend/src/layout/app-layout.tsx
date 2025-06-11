import { Combobox, createListCollection } from '@ark-ui/solid/combobox'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

import { Show } from 'solid-js'

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/solid-query'

import { createChat } from '@/data/api/chats/create-chat'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/ui/menu'

import { MacOsWindowControls } from '../components/macos/macos-window-controls'
import { useWorkspace } from '../data/queries/workspaces/use-workspace'
import { GET_CHATS_KEYS } from '../data/utils/query-keys'
import { ActionsDialog } from '../features/actions/actions-dialog'
import { ContextMenuContainer } from '../features/context-menu/context-menu-container'
import { DialogsDialog } from '../features/dialogs/dialogs-dialog'
import { Tabs } from '../features/tabs/tabs'
import { TabsKbdShortcuts } from '../features/tabs/tabs-kbd-shortcuts'
import { appConfig } from '../stores/app-config.store'
import { navigationStore } from '../stores/navigation.store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Sidebar } from './components/sidebar'
import { Content } from './content/content'

const client = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
})

/**
 * App Layout
 *
 * This is the main layout for the app.
 *
 * The structure looks like this:
 *
 * | NavigationSidebar | Sidebar (collapsable) | Content |
 */
export default function AppLayout() {
  return (
    <QueryClientProvider client={client}>
      <div class="size-full flex flex-col gap-6px">
        <TopBar />
        <div class="flex w-full h-full flex-1 gap-6px">
          <Sidebar />
          <Content />
        </div>
      </div>
      <ActionsDialog />
      <DialogsDialog />
      <ContextMenuContainer />
      <SolidQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

function TopBar() {
  const queryClient = useQueryClient()

  const workspace = useWorkspace({
    workspaceId: () => navigationStore.workspace.id,
  })

  return (
    <div class="flex items-center gap-6px">
      <div
        class="h-top-bar flex items-center gap-16px flex-shrink-0"
        classList={{
          'w-sidebar': navigationStore.sidebar.isOpen,
        }}
      >
        {appConfig.window.showTrafficLights ? (
          <MacOsWindowControls />
        ) : (
          <div class="w-navigation-sidebar flex justify-center flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button class="rounded-12px uppercase text-ui-small bg-gradient-to-br bg-gradient-from-[#29322E] bg-gradient-to-[#12473E] size-38px font-500 flex items-center justify-center">
                  {workspace.data?.name[0]}
                  {workspace.data?.name[1]}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Switch to traffic lights</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Minimize</DropdownMenuItem>
                <DropdownMenuItem>Maximize</DropdownMenuItem>
                <DropdownMenuItem>Fullscreen</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Quit</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div class="flex items-center justify-between gap-5px w-full">
          <div class="flex items-center gap-6px">
            <div class="i-lucide:layers text-ui-icon" />
            <span class="text-11px font-400 font-sans">
              {workspace.data?.name}
            </span>
          </div>
          <div class="flex items-center gap-0px">
            <button class="rounded-default size-24px flex items-center justify-center cursor-default">
              <div class="i-lucide:chevrons-up-down text-ui-icon text-muted" />
            </button>
            <Menu
              positioning={{
                placement: 'bottom',
              }}
            >
              <MenuTrigger>
                <button class="rounded-default size-24px flex items-center justify-center cursor-default">
                  <div class="i-lucide:plus text-ui-icon text-muted" />
                </button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem
                  value="new-chat"
                  onClick={() => {
                    createChat(navigationStore.workspace.id).then(() => {
                      queryClient.invalidateQueries({
                        queryKey: GET_CHATS_KEYS({
                          workspaceId: () => navigationStore.workspace.id,
                        }),
                      })
                    })
                  }}
                >
                  New chat
                </MenuItem>
              </MenuContent>
            </Menu>
            <button class="rounded-default size-24px flex items-center justify-center cursor-default">
              <div class="i-lucide:search text-ui-icon text-muted" />
            </button>
            <button class="rounded-default size-24px flex items-center justify-center cursor-default">
              <div class="i-lucide:ellipsis-vertical text-ui-icon text-muted" />
            </button>
          </div>
        </div>
      </div>

      <Tabs />
      <TabsKbdShortcuts />
    </div>
  )
}
