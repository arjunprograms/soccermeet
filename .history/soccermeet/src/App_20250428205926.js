import "./App.css"
import AppRouter from "./AppRouter"
import { BusIcon as SoccerBall } from "lucide-react"

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>
          <SoccerBall className="inline-block mr-2 h-6 w-6" />
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
