import { Switch as KobalteSwitch } from "@kobalte/core/switch";
import { ComponentProps, JSX } from "solid-js";

export function Switch(props: ComponentProps<typeof KobalteSwitch>) {
  return (
    <KobalteSwitch {...props} class="flex items-center gap-8px">
      <KobalteSwitch.Input />
      <KobalteSwitch.Control
        class="
          inline-flex h-26px w-42px cursor-pointer items-center rounded-full
          border-2 border-[#212623] bg-[#262828]
          transition-colors duration-200
          data-[checked]:bg-[#567C5E]
          data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50
        "
      >
        <KobalteSwitch.Thumb
          class="
            block h-14px w-17px translate-x-2px rounded-full
            bg-[#4A4D4B] shadow-lg
            transition-all duration-200
            data-[checked]:translate-x-17px data-[checked]:bg-[#DAEEE7]
          "
        />
      </KobalteSwitch.Control>
    </KobalteSwitch>
  );
}

interface SwitchLabelProps extends ComponentProps<typeof KobalteSwitch.Label> {}

export function SwitchLabel(props: SwitchLabelProps) {
  return <KobalteSwitch.Label class="text-14px font-400" {...props} />;
}

interface SwitchDescriptionProps
  extends ComponentProps<typeof KobalteSwitch.Description> {}

export function SwitchDescription(props: SwitchDescriptionProps) {
  return (
    <KobalteSwitch.Description class="text-12px text-[#7C8B82]" {...props} />
  );
}

interface SwitchErrorMessageProps
  extends ComponentProps<typeof KobalteSwitch.ErrorMessage> {}

export function SwitchErrorMessage(props: SwitchErrorMessageProps) {
  return (
    <KobalteSwitch.ErrorMessage class="text-12px text-red-500" {...props} />
  );
}

// Default configuration for switches
export const defaultSwitchProps = {
  // Add any default props here if needed
};
