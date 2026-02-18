declare module "electrobun/bun" {
  export interface BrowserWindowOptions {
    title?: string;
    url: string;
    frame?: {
      width: number;
      height: number;
      x?: number;
      y?: number;
    };
    titleBarStyle?: string;
  }

  export class BrowserWindow {
    constructor(options: BrowserWindowOptions);
    on(event: "close", listener: () => void): void;
  }

  export namespace Updater {
    namespace localInfo {
      function channel(): Promise<string>;
    }
  }

  export namespace Utils {
    function quit(): void;
  }
}
