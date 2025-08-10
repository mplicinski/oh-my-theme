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
import { oneDark } from '@codemirror/theme-one-dark'

import { ThemeStore } from '~/stores/ThemeStore'
import { buildPathMap } from '~/lib/jsonPathMap'
import { PathMapStore } from '~/stores/PathMapStore'

import './EditorPanel.pcss'
import { hoveredPath, setHoveredPath } from '~/stores/hoveredPathStore'
import { findHighlightPath } from '~/lib/findHighlightPath'

const setHoverRange = StateEffect.define<{ from: number; to: number } | null>()
const hoverDeco = Decoration.mark({ class: 'hovered-range' })
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

// ghost (fade-out) highlight
const setGhostRange = StateEffect.define<{ from: number; to: number } | null>()
const ghostDeco = Decoration.mark({ class: 'hovered-ghost' })

const hoverGhostField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decos, tr) {
    // collect all setGhostRange effects in this transaction
    const ranges: Array<{ from: number; to: number } | null> = []
    for (const e of tr.effects) {
      if (e.is(setGhostRange)) ranges.push(e.value)
    }
    if (ranges.length) {
      // if every payload is null -> clear
      if (ranges.every(r => r == null)) return Decoration.none
      const b = new RangeSetBuilder<Decoration>()
      for (const r of ranges) {
        if (r && r.from < r.to) b.add(r.from, r.to, ghostDeco)
      }
      return b.finish()
    }
    return tr.docChanged ? decos.map(tr.changes) : decos
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
          oneDark,
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap]),
          json(),
          mouseHoverHandlers,
          hoverGhostField,
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

  let lastPayload: { from: number; to: number } | null = null
  let ghostTimer: number | null = null

  function contains(
    a: { from: number; to: number } | null,
    b: { from: number; to: number } | null
  ) {
    return !!(a && b && a.from <= b.from && a.to >= b.to)
  }

  createEffect(() => {
    if (!view) return

    const path = hoveredPath()
    const info = path ? PathMapStore.pathMap().get(path) : null
    const payload = info ? { from: info.from, to: info.to } : null

    const changed =
      !!lastPayload &&
      (!payload || payload.from !== lastPayload.from || payload.to !== lastPayload.to)

    if (changed) {
      const ancestorSwitch = contains(payload, lastPayload) // segment -> block
      const descendantSwitch = contains(lastPayload, payload) // block -> segment
      const overlappingFamily = ancestorSwitch || descendantSwitch

      if (!overlappingFamily && lastPayload) {
        // sibling move -> single ghost of previous range
        view.dispatch({ effects: setGhostRange.of(lastPayload) })
        if (ghostTimer) clearTimeout(ghostTimer)
        ghostTimer = window.setTimeout(() => {
          view.dispatch({ effects: setGhostRange.of(null) })
          ghostTimer = null
        }, 300)
      } else if (descendantSwitch && lastPayload && payload) {
        // block -> segment → split ghost into left/right parts excluding new segment
        const effects: StateEffect<{ from: number; to: number } | null>[] = []
        const left = { from: lastPayload.from, to: Math.min(payload.from, lastPayload.to) }
        const right = { from: Math.max(payload.to, lastPayload.from), to: lastPayload.to }
        if (left.from < left.to) effects.push(setGhostRange.of(left))
        if (right.from < right.to) effects.push(setGhostRange.of(right))
        // if no leftover parts, clear any ghost
        if (effects.length === 0) effects.push(setGhostRange.of(null))
        view.dispatch({ effects })
        if (ghostTimer) clearTimeout(ghostTimer)
        ghostTimer = window.setTimeout(() => {
          // clear all ghosts after fade-out duration
          view.dispatch({ effects: setGhostRange.of(null) })
          ghostTimer = null
        }, 300)
      } else {
        // segment -> block (ancestor) or anything else -> no overlapping ghost
        if (ghostTimer) {
          clearTimeout(ghostTimer)
          ghostTimer = null
        }
        view.dispatch({ effects: setGhostRange.of(null) })
      }
    }

    // always set the current active highlight
    view.dispatch({ effects: setHoverRange.of(payload) })
    lastPayload = payload
  })

  onCleanup(() => {
    if (raf) cancelAnimationFrame(raf)
    view?.destroy()
  })

  return <div ref={editorRef} class="editor" />
}
