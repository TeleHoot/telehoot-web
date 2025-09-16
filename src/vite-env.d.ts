interface ImportMetaEnv {
  readonly VITE_API: string;
  readonly VITE_IS_DEV: boolean;
  readonly VITE_BOT_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
