import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Lobby from './components/Lobby'
import Game from './components/Game'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game" element={<Game />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
