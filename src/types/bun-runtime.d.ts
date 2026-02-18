declare const Bun: {
  argv: string[];
  write(path: string, data: string): Promise<number>;
  spawn(
    cmd: string[],
    options?: {
      cwd?: string;
      env?: Record<string, string>;
      stdio?: ["inherit", "inherit", "inherit"];
    },
  ): {
    exited: Promise<number>;
  };
};

interface ImportMeta {
  dir: string;
}

declare module "bun:sqlite" {
  export class Database {
    constructor(
      filename: string,
      options?: {
        create?: boolean;
        readwrite?: boolean;
        readonly?: boolean;
      },
    );
    run(sql: string, ...params: unknown[]): unknown;
    close(): void;
  }
}
