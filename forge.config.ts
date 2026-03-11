import { rename } from "node:fs/promises";
import path from "node:path";
import type { ForgeConfig, ForgeMakeResult } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const isPrereleaseTag = (process.env.GITHUB_REF_NAME ?? "").includes("-");

const releasePlatformName = (platform: ForgeMakeResult["platform"]) => {
  switch (platform) {
    case "darwin":
      return "macos";
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    default:
      return platform;
  }
};

const renamedArtifactPath = (makeResult: ForgeMakeResult, artifactPath: string) => {
  const platformName = releasePlatformName(makeResult.platform);
  const version = makeResult.packageJSON.version;
  const artifactDir = path.dirname(artifactPath);
  const artifactName = path.basename(artifactPath);
  const artifactExtension = path.extname(artifactPath).toLowerCase();
  const releaseName = `mynth-${platformName}-${version}`;

  if (makeResult.platform === "win32") {
    if (artifactName === "RELEASES") {
      return path.join(artifactDir, `${releaseName}-releases`);
    }

    if (artifactName.endsWith(".nupkg")) {
      if (artifactName.includes("-delta.")) {
        return path.join(artifactDir, `${releaseName}-delta.nupkg`);
      }

      return path.join(artifactDir, `${releaseName}-full.nupkg`);
    }

    if (artifactExtension === ".exe") {
      return path.join(artifactDir, `${releaseName}-setup.exe`);
    }

    if (artifactExtension === ".msi") {
      return path.join(artifactDir, `${releaseName}.msi`);
    }
  }

  return path.join(artifactDir, `${releaseName}${artifactExtension}`);
};

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: ["src/main-process/db/migrations"],
  },
  rebuildConfig: {},
  hooks: {
    postMake: async (_forgeConfig, makeResults) => {
      for (const makeResult of makeResults) {
        makeResult.artifacts = await Promise.all(
          makeResult.artifacts.map(async (artifactPath) => {
            const nextArtifactPath = renamedArtifactPath(makeResult, artifactPath);

            if (nextArtifactPath === artifactPath) {
              return artifactPath;
            }

            await rename(artifactPath, nextArtifactPath);
            return nextArtifactPath;
          }),
        );
      }

      return makeResults;
    },
  },
  makers: [new MakerSquirrel({}), new MakerZIP({}, ["darwin"]), new MakerRpm({}), new MakerDeb({})],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "mynthio",
          name: "mynth-app",
        },
        draft: false,
        prerelease: isPrereleaseTag,
        generateReleaseNotes: true,
        force: true,
      },
    },
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
