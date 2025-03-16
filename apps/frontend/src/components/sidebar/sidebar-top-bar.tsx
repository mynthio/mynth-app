import { JSX } from "solid-js";

type TopBarProps = {
  children: JSX.Element;
};

export function TopBar(props: TopBarProps) {
  return (
    <div class="h-top-bar flex items-center justify-between px-8px">
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
    <div class="flex items-center gap-8px text-11px font-500 uppercase w-full text-muted">
      {props.icon ? (
        <div class={[props.icon, "text-10px flex-shrink-0"].join(" ")} />
      ) : null}
      <span class="truncate">{props.children}</span>
    </div>
  );
}

type TopBarControlsProps = {
  children: JSX.Element;
};

export function TopBarControls(props: TopBarControlsProps) {
  return (
    <div class="flex items-center flex-shrink-0 gap-3px">{props.children}</div>
  );
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
      class="text-11px size-20px rounded-4px transition-duration-400ms transition-colors flex items-center justify-center"
      classList={{
        "text-active bg-accent/10": props.isActive,
        "text-muted": !props.isActive,
      }}
    >
      <div class={props.icon} />
    </button>
  );
}
