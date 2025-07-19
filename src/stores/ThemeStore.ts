import { createSignal } from 'solid-js'
import { defaultTheme } from '~/lib/defaultTheme'

const [themeJSON, setThemeJSON] = createSignal(JSON.stringify(defaultTheme, null, 2))

export const ThemeStore = {
  themeJSON,
  setThemeJSON,
}
