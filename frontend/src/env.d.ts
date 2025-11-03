interface ImportMetaEnv {
    readonly VITE_APP_VERSION: string
    // add more env variables types here
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}