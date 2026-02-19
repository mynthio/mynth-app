export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type Theme = "dark";

export interface AppConfig {
  app: {
    theme: Theme;
    activeWorkspaceId: string;
  };
  chat: {
    message: {
      fontSize: number;
    };
  };
}
