import { createSignal } from 'solid-js'

import { JsonPathString } from '~/lib/types'

export const [hoveredPath, setHoveredPath] = createSignal<JsonPathString | null>(null)
