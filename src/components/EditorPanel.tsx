// src/components/EditorPanel.tsx
import { onCleanup, onMount } from 'solid-js'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { bracketMatching } from '@codemirror/language'
import { highlightSelectionMatches } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { json } from '@codemirror/lang-json'

import { ThemeStore } from '~/stores/ThemeStore'
import './EditorPanel.pcss'

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
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              ThemeStore.setThemeJSON(update.state.doc.toString())
            }
          }),
        ],
      }),
      parent: editorRef!,
    })
  })

  onCleanup(() => {
    view?.destroy()
  })

  return <div ref={editorRef} class="editor" />
}
