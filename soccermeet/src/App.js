import "./App.css"
import AppRouter from "./AppRouter"

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>
          {/* Soccer ball emoji as a simple alternative */}
          <span className="soccer-icon" role="img" aria-label="soccer">
            ⚽
          </span>
          SoccerMeet
        </h1>
      </header>
      <main>
        <AppRouter />
      </main>
    </div>
  )
}

export default App
