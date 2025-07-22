import { createSignal } from 'solid-js'

import { EditorPanel } from '~/components/EditorPanel'
import './app.pcss'

export default function App() {
  return (
    <main>
      <div>
        <h1>oh my theme</h1>
        <EditorPanel />
      </div>
    </main>
  )
}
