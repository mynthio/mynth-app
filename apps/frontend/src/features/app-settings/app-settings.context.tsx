import {
  createContext,
  useContext,
  createSignal,
  Component,
  JSX,
} from "solid-js";

export type StaticSettingsItem =
  | "general"
  | "chats"
  | "look-and-feel"
  | "add-ai-integration";
export type DynamicSettingsItemType = "workspace" | "ai-integration";

export type ActiveSettingsItem =
  | { type: "static"; item: StaticSettingsItem }
  | { type: DynamicSettingsItemType; id: string };

interface AppSettingsContextType {
  activeItem: () => ActiveSettingsItem | null;
  setActiveItem: (item: ActiveSettingsItem | null) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType>();

export const AppSettingsProvider: Component<{ children: JSX.Element }> = (
  props
) => {
  const [activeItem, setActiveItem] = createSignal<ActiveSettingsItem | null>({
    type: "static",
    item: "general",
  }); // Default to 'general'

  const contextValue: AppSettingsContextType = {
    activeItem,
    setActiveItem,
  };

  return (
    <AppSettingsContext.Provider value={contextValue}>
      {props.children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error(
      "useAppSettings must be used within an AppSettingsProvider"
    );
  }
  return context;
};
