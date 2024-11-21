/* @refresh reload */
import { render } from "solid-js/web";
import { Router } from "@solidjs/router";
import { lazy } from "solid-js";
import RootLayout from "./layouts/root-layout";

const routes = [
  {
    path: "/",
    component: lazy(() => import("./pages/home")),
  },
  {
    path: "/settings",
    component: lazy(() => import("./pages/settings")),
  },
  {
    path: "/chat/:id",
    component: lazy(() => import("./pages/chat/chat.page")),
  },
];

render(
  () => <Router root={RootLayout}>{routes}</Router>,
  document.getElementById("root") as HTMLElement
);
