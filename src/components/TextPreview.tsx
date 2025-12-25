import { createMemo, For, Show } from 'solid-js'
import { buildPreviewModel } from '~/lib/previewModel'
import { hoveredPath, setHoveredPath } from '~/stores/hoveredPathStore'
import { ThemeStore } from '~/stores/ThemeStore'

import './TextPreview.pcss'

let raf = 0
function inRaf(fn: () => void) {
  if (raf) cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    raf = 0
    fn()
  })
}

export default function TextPreview() {
  const model = createMemo(() => buildPreviewModel(ThemeStore.themeJSON()))

  const isSegmentActive = (path: string) => hoveredPath() === path
  const isBlockActive = (blockPath: string) => {
    const h = hoveredPath()
    return h === blockPath || (h?.startsWith(blockPath + '.segments[') ?? false)
  }

  return (
    <div class="preview-viewport">
      <div class="preview">
        <For each={model()}>
          {block => {
            const blockActive = () => isBlockActive(block.path)
            return (
              <div
                class={`block ${blockActive() ? 'is-active' : ''}`}
                // If pointer is over the block but NOT over a .segment, claim the block
                onMouseMove={e => {
                  inRaf(() => {
                    const target = e.target as HTMLElement
                    if (!target.closest('.segment')) setHoveredPath(block.path)
                  })
                }}
                onMouseLeave={() => setHoveredPath(null)}
                data-path={block.path}
              >
                <div class="block-header">
                  <span class="badge">{(block.alignment ?? 'block').toUpperCase()}</span>
                  <span class="path">{block.path}</span>
                </div>

                <div class="segments">
                  <For each={block.segments}>
                    {seg => {
                      const segActive = () => isSegmentActive(seg.path)
                      return (
                        <div
                          class={`segment ${segActive() ? 'is-active' : blockActive() ? 'is-in-block' : ''}`}
                          // Select the segment
                          onMouseEnter={() => setHoveredPath(seg.path)}
                          // Leaving a segment hand back to the block
                          onMouseLeave={() => setHoveredPath(block.path)}
                          data-path={seg.path}
                          title={`${(seg.type ?? 'segment').toUpperCase()} — ${seg.template ?? ''}`}
                        >
                          <div class="segment-top">
                            <span class="seg-type">{(seg.type ?? 'segment').toUpperCase()}</span>
                            <span class="seg-path">{seg.path}</span>
                          </div>
                          <Show when={seg.template}>
                            <div class="seg-template">{seg.template}</div>
                          </Show>
                        </div>
                      )
                    }}
                  </For>
                </div>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}
