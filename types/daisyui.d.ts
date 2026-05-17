declare module 'daisyui' {
  import type { PluginCreator } from 'tailwindcss/types/config'
  const plugin: PluginCreator & { withOptions: (...args: unknown[]) => PluginCreator }
  export default plugin
}
