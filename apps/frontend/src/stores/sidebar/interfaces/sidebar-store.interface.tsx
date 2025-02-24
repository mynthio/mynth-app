import { SidebarComponent } from "../types/sidebar-component.type";

export interface SidebarStore {
  open: boolean;

  component: SidebarComponent;
}
