import type { PathInfo } from '~/lib/jsonPathMap'

export function findDeepestPath(map: Map<string, PathInfo>, pos: number): string | null {
  let best: { key: string; span: number } | null = null
  for (const [key, info] of map.entries()) {
    if (pos >= info.from && pos <= info.to) {
      const span = info.to - info.from
      if (!best || span < best.span) best = { key, span }
    }
  }
  return best ? best.key : null
}
