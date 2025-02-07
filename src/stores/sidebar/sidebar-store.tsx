import { createStore } from "solid-js/store";
import { SidebarStore } from "./interfaces/sidebar-store.interface";
import { SidebarComponent } from "./types/sidebar-component.type";
import { makePersisted } from "@solid-primitives/storage";

const [sidebarState, setSidebarState] = makePersisted(
  createStore<SidebarStore>({
    open: true,
    component: "chats",
  }),
  {
    name: "mynth:app:sidebar",
  }
);

const openSidebar = () => {
  setSidebarState("open", true);
};

const closeSidebar = () => {
  setSidebarState("open", false);
};

const toggleSidebar = () => {
  setSidebarState("open", !sidebarState.open);
};

const setSidebarComponent = (component: SidebarComponent) => {
  setSidebarState("component", component);
};

const toggleSidebarComponent = (component: SidebarComponent) => {
  if (sidebarState.open && sidebarState.component === component) {
    setSidebarState("open", false);
    return;
  }

  setSidebarState("component", component);
  setSidebarState("open", true);
};

export {
  sidebarState,
  openSidebar,
  closeSidebar,
  toggleSidebar,
  setSidebarComponent,
  toggleSidebarComponent,
};
