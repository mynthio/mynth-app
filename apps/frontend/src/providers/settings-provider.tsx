import {
  createContext,
  JSX,
  useContext,
  createSignal,
  Accessor,
} from "solid-js";

type View =
  | "general"
  | "themes_and_appearance"
  | "commands"
  | "keyboard_shortcuts"
  | "advanced"
  | "ai_integration";

interface ISettingsRouter {
  view: Accessor<View>;
  props: Accessor<Record<string, unknown>>;
  setView: (view: View) => void;
  setProps: (props: Record<string, unknown>) => void;
}

export const SettingsRouterContext = createContext<ISettingsRouter>();

export function SettingsProvider({ children }: { children: JSX.Element }) {
  const [view, setView] = createSignal<View>("general");
  const [props, setProps] = createSignal<Record<string, unknown>>({});

  console.log("SETTINGS PROVIDER");

  return (
    <SettingsRouterContext.Provider value={{ view, props, setView, setProps }}>
      {children}
    </SettingsRouterContext.Provider>
  );
}

export function useSettingsRouter() {
  const context = useContext(SettingsRouterContext);

  if (!context) {
    throw new Error("SettingsRouterContext not found");
  }
  return context;
}
