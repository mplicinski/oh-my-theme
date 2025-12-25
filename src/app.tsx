import { EditorPanel } from '~/components/EditorPanel'
import TextPreview from './components/TextPreview'
import './app.pcss'

export default function App() {
  return (
    <main>
      <header class="header">
        <h1 class="title">oh my theme</h1>
        <nav class="nav">
          <a href="https://ohmyposh.dev/docs" target="_blank" rel="noopener noreferrer">
            Docs
          </a>
          <a href="https://ohmyposh.dev/docs/themes" target="_blank" rel="noopener noreferrer">
            Themes
          </a>
          <a
            href="https://github.com/mplicinski/oh-my-theme"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>
      <div class="container">
        <div class="pane">
          <EditorPanel />
        </div>
        <div class="pane">
          <TextPreview />
        </div>
      </div>
    </main>
  )
}
