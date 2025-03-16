import { ActionsDialog } from "../features/actions/actions-dialog";
import { ContextMenuContainer } from "../features/context-menu/context-menu-container";
import { Content } from "./content/content";
import { NavigationSidebar } from "./navigation-sidebar/navigation-sidebar";
import { Sidebar } from "./sidebar/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
const client = new QueryClient();

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
      <div class="flex size-full">
        <NavigationSidebar />
        <Sidebar />
        <Content />
      </div>
      <ActionsDialog />
      <ContextMenuContainer />
      <SolidQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
