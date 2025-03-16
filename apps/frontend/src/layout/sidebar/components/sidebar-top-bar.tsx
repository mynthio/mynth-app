import { JSX } from "solid-js";

type TopBarProps = {
  children: JSX.Element;
};

export function TopBar(props: TopBarProps) {
  return (
    <div class="h-top-bar flex items-center justify-between px-12px">
      {props.children}
    </div>
  );
}

type TopBarTitleProps = {
  children: JSX.Element;
  icon?: string;
};

export function TopBarTitle(props: TopBarTitleProps) {
  return (
    <div class="flex items-center gap-6px text-12px uppercase text-accent">
      {props.icon ? <div class={[props.icon, "text-11px"].join(" ")} /> : null}
      {props.children}
    </div>
  );
}

type TopBarControlsProps = {
  children: JSX.Element;
};

export function TopBarControls(props: TopBarControlsProps) {
  return <div class="flex items-center gap-3px">{props.children}</div>;
}

type TopBarControlButtonProps = {
  icon: string;
  isActive?: boolean;
  onClick: () => void;
};

export function TopBarControlButton(props: TopBarControlButtonProps) {
  return (
    <button
      onClick={props.onClick}
      class="text-12px"
      classList={{
        "text-accent bg-accent/10": props.isActive,
        "text-accent": !props.isActive,
      }}
    >
      <div class={props.icon} />
    </button>
  );
}
