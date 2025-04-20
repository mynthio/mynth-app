import {
  defineConfig,
  presetWind3,
  presetWebFonts,
  presetIcons,
  presetTypography,
} from "unocss";
import { presetScrollbar } from "unocss-preset-scrollbar";
import { presetAnimations } from "unocss-preset-animations";

export default defineConfig({
  shortcuts: {
    root: "selector-[:root]:[--top-bar-height:40px]",
    "scrollbar-app":
      "scrollbar scrollbar-track-color-transparent scrollbar-thumb-color-accent/50 scrollbar-rounded scrollbar-w-3px scrollbar-h-3px scrollbar-radius-2 scrollbar-track-radius-4 scrollbar-thumb-radius-4",
  },
  theme: {
    fontSize: {
      ui: "14px",
      "ui-small": "12px",
      "ui-icon": "11px",
      "ui-icon-small": "10px",
    },
    colors: {
      body: "oklch(81.06% 0.0133 172.27)",
      // background: "oklch(18% 0.003 157.77)",
      accent: "oklch(59.91% 0.0107 196.87)",
      muted: "oklch(62.46% 0.0184 173.82)",
      active: "oklch(90.4% 0.0334 172.77)",

      window: "oklch(0.2 0.0031 196.91)",
      "window-elements-background": "oklch(0.22 0.003 196.94)",
      background: "oklch(0.22 0.003 196.94)",
      "elements-background": "oklch(0.25 0.0044 196.87)",
      "elements-background-soft": "oklch(0.27 0.0058 196.82)",
    },
    width: {
      "navigation-sidebar": "60px",
      sidebar: "410px",
      button: "32px",
    },
    height: {
      "top-bar": "var(--top-bar-height)",
      button: "32px",
    },
    borderRadius: {
      default: "9px",
      window: "11px",
    },
  },
  presets: [
    presetWind3(),
    presetWebFonts({
      provider: "google",
      fonts: {
        sans: {
          name: "Open Sans",
          weights: ["100", "200", "300", "400", "500", "600", "700", "800"],
        },
        mono: "Fira Code",
      },
    }),
    presetIcons({
      collections: {
        lucide: () =>
          import("@iconify-json/lucide/icons.json").then((i) => i.default),
      },
    }),
    presetScrollbar(),
    presetTypography(),
    presetAnimations(),
  ],
});
