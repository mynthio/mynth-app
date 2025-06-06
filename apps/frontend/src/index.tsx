/* @refresh reload */
// import { enableMapSet } from "immer";
import { attachDevtoolsOverlay } from '@solid-devtools/overlay'
import '@unocss/reset/tailwind.css'
import { render } from 'solid-js/web'
import 'virtual:uno.css'

// FONTS

// https://fontsource.org/fonts/lato
// import "@fontsource/lato/100.css";
// import "@fontsource/lato/300.css";
// import "@fontsource/lato/400.css";
// import "@fontsource/lato/700.css";
// import "overlayscrollbars/styles/overlayscrollbars.css";
import App from './App'

attachDevtoolsOverlay()

// enableMapSet();

render(() => <App />, document.getElementById('root') as HTMLElement)
