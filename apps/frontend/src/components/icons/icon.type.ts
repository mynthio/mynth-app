import { Component, JSXElement } from "solid-js";

type IconProps = {
  size?: number;
};

export type BaseIcon = Component<IconProps & { children: JSXElement }>;
export type Icon = Component<IconProps>;
