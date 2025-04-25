import CorvuTooltip from "@corvu/tooltip";
import { ComponentProps } from "solid-js";

const useTooltip = CorvuTooltip.useContext;

interface TooltipProps extends ComponentProps<typeof CorvuTooltip> {}

export function Tooltip(props: TooltipProps) {
  return <CorvuTooltip {...props} />;
}

interface TooltipTriggerProps
  extends ComponentProps<typeof CorvuTooltip.Trigger> {}

export function TooltipTrigger(props: TooltipTriggerProps) {
  return <CorvuTooltip.Trigger {...props} />;
}

interface TooltipContentProps
  extends ComponentProps<typeof CorvuTooltip.Content> {}

export function TooltipContent(props: TooltipContentProps) {
  return (
    <CorvuTooltip.Portal>
      <CorvuTooltip.Content
        {...props}
        class="
          max-w-[350px] rounded-lg border border-elements-background
          bg-background/10 backdrop-blur-32px rounded-12px p-5px border border-[#889894]/15 shadow-xl
          px-12px py-8px text-14px font-400
          data-[open]:animate-in data-[open]:fade-in-50% data-[open]:slide-in-from-bottom-1 data-[open]:animate-duration-[200ms]
          data-[closed]:animate-out data-[closed]:fade-out-50% data-[closed]:slide-out-to-bottom-1 data-[closed]:animate-duration-[200ms]"
      >
        {props.children}
      </CorvuTooltip.Content>
    </CorvuTooltip.Portal>
  );
}

// Default configuration for tooltips
const defaultTooltipProps = {
  placement: "top" as const,
  openDelay: 200,
  floatingOptions: {
    offset: 8,
    flip: true,
    shift: true,
  },
};
