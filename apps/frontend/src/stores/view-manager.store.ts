import { createSignal } from 'solid-js';

export type ViewType = 'app' | 'settings';

const [activeView, setActiveView] = createSignal<ViewType>('app');

export const viewManager = {
  activeView,
  setView: (view: ViewType) => setActiveView(view),
};