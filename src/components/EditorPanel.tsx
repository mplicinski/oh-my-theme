// src/components/EditorPanel.tsx
import { createEffect, onCleanup, onMount } from 'solid-js'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  Decoration,
  DecorationSet,
} from '@codemirror/view'
import { EditorState, RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { bracketMatching } from '@codemirror/language'
import { highlightSelectionMatches } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { json } from '@codemirror/lang-json'

import { ThemeStore } from '~/stores/ThemeStore'
import { buildPathMap } from '~/lib/jsonPathMap'
import { PathMapStore } from '~/stores/PathMapStore'

import './EditorPanel.pcss'
import { hoveredPath, setHoveredPath } from '~/stores/hoveredPathStore'
import { findHighlightPath } from '~/lib/findHighlightPath'

const setHoverRange = StateEffect.define<{ from: number; to: number } | null>()
const hoverDeco = Decoration.mark({ class: 'cm-hovered-range' })
const hoverHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decos, tr) {
    for (const e of tr.effects) {
      if (e.is(setHoverRange)) {
        const b = new RangeSetBuilder<Decoration>()
        if (e.value && e.value.from < e.value.to) {
          b.add(e.value.from, e.value.to, hoverDeco)
        }
        return b.finish()
      }
    }
    if (tr.docChanged) return decos.map(tr.changes)
    return decos
  },
  provide: f => EditorView.decorations.from(f),
})

let raf = 0
const mouseHoverHandlers = EditorView.domEventHandlers({
  mousemove(event, view) {
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = 0
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
      if (pos == null) return
      const key = findHighlightPath(PathMapStore.pathMap(), pos)
      if (key !== hoveredPath()) setHoveredPath(key)
    })
  },
  mouseleave() {
    setHoveredPath(null)
  },
})

// helper function to parse out unicodes characters to plain text
function escapeUnicode(str: string): string {
  return str.replace(
    /[\u007f-\uffff]/g,
    ch => '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4)
  )
}

export const EditorPanel = () => {
  let editorRef: HTMLDivElement | undefined
  let view: EditorView

  onMount(() => {
    view = new EditorView({
      state: EditorState.create({
        doc: escapeUnicode(ThemeStore.themeJSON()),
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          history(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap]),
          json(),
          mouseHoverHandlers,
          hoverHighlightField,
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              ThemeStore.setThemeJSON(update.state.doc.toString())
              const pathMap = buildPathMap(update.state)
              PathMapStore.setPathMap(pathMap)
            }
          }),
        ],
      }),
      parent: editorRef!,
    })

    PathMapStore.setPathMap(buildPathMap(view.state))
  })

  createEffect(() => {
    if (!view) return
    const path = hoveredPath()
    const info = path ? PathMapStore.pathMap().get(path) : null
    const payload = info ? { from: info.from, to: info.to } : null
    view.dispatch({ effects: setHoverRange.of(payload) })
  })

  onCleanup(() => {
    if (raf) cancelAnimationFrame(raf)
    view?.destroy()
  })

  return <div ref={editorRef} class="editor" />
}
