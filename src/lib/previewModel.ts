export type PreviewBlock = {
  path: string // ".blocks[0]"
  alignment?: string
  segments: PreviewSegment[]
}

export type PreviewSegment = {
  path: string // ".blocks[0].segments[2]"
  type?: string
  template?: string
  background?: string
  foreground?: string
}

export function buildPreviewModel(jsonText: string): PreviewBlock[] {
  let data: any
  try {
    data = JSON.parse(jsonText)
  } catch {
    return []
  }
  const blocks = Array.isArray(data?.blocks) ? data.blocks : []
  return blocks.map((b: any, i: number) => {
    const blockPath = `.blocks[${i}]`
    const segments = Array.isArray(b?.segments) ? b.segments : []
    return {
      path: blockPath,
      alignment: b?.alignment,
      segments: segments.map((s: any, j: number) => ({
        path: `${blockPath}.segments[${j}]`,
        type: s?.type,
        template: s?.template,
        background: s?.background,
        foreground: s?.foreground,
      })),
    }
  })
}
