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
  shortcuts: [["root", "selector-[:root]:[--top-bar-height:42px]"]],
  theme: {
    colors: {
      body: "oklch(81.06% 0.0133 172.27)",
      // background: "oklch(18% 0.003 157.77)",
      background: "oklch(19.42% 0.0025 145.48)",
      accent: "oklch(59.91% 0.0107 196.87)",
      muted: "oklch(62.46% 0.0184 173.82)",
      active: "oklch(90.4% 0.0334 172.77)",
    },
    width: {
      "navigation-sidebar": "72px",
      sidebar: "390px",
    },
    height: {
      "top-bar": "var(--top-bar-height)",
    },
    borderRadius: {
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
          weights: ["400", "500", "600", "700", "800"],
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
