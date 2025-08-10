// src/lib/findPreviewUnitPathAtPos.ts
import type { PathInfo } from '~/lib/jsonPathMap'

const isSegment = /^\.?blocks\[\d+\]\.segments\[\d+\]$/ // regex matches: blocks[0].segments[2]
const isSegmentsArray = /^\.?blocks\[(\d+)\]\.segments$/ // regex matches: .blocks[0].segments
const isBlock = /^\.?blocks\[(\d+)\]$/ // regex matches: .blocks[0]

function getDistance(pos: number, from: number, to: number): number {
  if (pos < from) return from - pos
  if (pos > to) return pos - to
  return 0
}

/**
 * Returns the json path "unit" path that should be highlighted for a given position
 *  - prefers an individual segment (blocks[i].segments[j])
 *  - falls back to nearest segment if hovering in gap between segments
 *  - else, if inside a block, fall back to the block
 *  - else null
 */
export function findHighlightPath(map: Map<string, PathInfo>, pos: number): string | null {
  // Collect all nodes that contain pos
  const enclosing: Array<{ key: string; info: PathInfo }> = []
  for (const [key, info] of map.entries()) {
    if (pos >= info.from && pos <= info.to) enclosing.push({ key, info })
  }
  if (!enclosing.length) return null

  // Sort by smallest distance first (closest node)
  enclosing.sort((a, b) => a.info.to - a.info.from - (b.info.to - b.info.from))

  // If any enclosing node is itself a segment, use the smallest one
  const segHit = enclosing.find(e => isSegment.test(e.key))
  if (segHit) return segHit.key

  // If we are inside a segments array, pick the nearest child segment in that array
  const segArrayHit = enclosing.find(e => isSegmentsArray.test(e.key))
  if (segArrayHit) {
    const arrayPath = segArrayHit.key
    const candidates: Array<{ key: string; info: PathInfo; dist: number }> = []
    for (const [key, info] of map.entries()) {
      if (key.startsWith(arrayPath + '[') && isSegment.test(key)) {
        candidates.push({ key, info, dist: getDistance(pos, info.from, info.to) })
      }
    }
    if (candidates.length) {
      candidates.sort((a, b) => a.dist - b.dist)
      return candidates[0].key
    }
  }

  // Otherwise if we’re inside a block use the smallest enclosing block
  const blockHit = enclosing.find(e => isBlock.test(e.key))
  if (blockHit) return blockHit.key

  return null
}
