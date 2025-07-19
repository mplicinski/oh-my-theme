import { createSignal } from 'solid-js'
import './app.pcss'

export default function App() {
  const [count, setCount] = createSignal(0)

  return (
    <main>
      <h1>oh my theme</h1>
    </main>
  )
}
