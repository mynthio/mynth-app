export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

export type Theme = "dark";

export interface AppConfig {
  app: {
    theme: Theme;
  };
  chat: {
    message: {
      fontSize: number;
    };
  };
}
