import { createSignal } from 'solid-js'
import type { PathInfo } from '~/lib/jsonPathMap'

const [pathMap, setPathMap] = createSignal<Map<string, PathInfo>>(new Map())

export const PathMapStore = {
  pathMap,
  setPathMap,
}
