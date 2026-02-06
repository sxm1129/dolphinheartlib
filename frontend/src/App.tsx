import { Routes, Route, Link } from 'react-router-dom'
import TaskList from './routes/TaskList'
import TaskDetail from './routes/TaskDetail'
import SubmitGenerate from './routes/SubmitGenerate'
import SubmitTranscribe from './routes/SubmitTranscribe'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex gap-4">
          <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">
            任务列表
          </Link>
          <Link to="/generate" className="text-gray-700 hover:text-gray-900 font-medium">
            生成音乐
          </Link>
          <Link to="/transcribe" className="text-gray-700 hover:text-gray-900 font-medium">
            歌词转录
          </Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<TaskList />} />
          <Route path="/tasks/:taskId" element={<TaskDetail />} />
          <Route path="/generate" element={<SubmitGenerate />} />
          <Route path="/transcribe" element={<SubmitTranscribe />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
