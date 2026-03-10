import { useState, useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Header from './componentts/Header'

interface Problem {
  title: string
  difficulty: string
  description: string
  pythonCode: string | null
  options?: { code: string; type: string; label: string }[]
  correctType?: string
}

interface Score {
  correct: number
  total: number
}

const difficultyColors: Record<string, string> = {
  Easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Hard: 'bg-red-500/20 text-red-400 border-red-500/30'
}

function App() {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<string>('')
  const [gameMode, setGameMode] = useState(false)
  const [score, setScore] = useState<Score>({ correct: 0, total: 0 })
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('riggedcode-score')
    if (saved) {
      setScore(JSON.parse(saved))
    }
  }, [])

  const saveScore = (newScore: Score) => {
    setScore(newScore)
    localStorage.setItem('riggedcode-score', JSON.stringify(newScore))
  }

  const fetchProblem = async () => {
    setLoading(true)
    setError(null)
    setSelectedOption(null)
    setShowResult(false)
    try {
      const endpoint = gameMode ? '/quiz-problem' : '/random-problem'
      const url = difficulty 
        ? `http://localhost:5050${endpoint}?difficulty=${difficulty}`
        : `http://localhost:5050${endpoint}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch problem')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProblem(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProblem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode])

  const handleSubmit = () => {
    if (selectedOption === null || !problem?.options) return

    const selected = problem.options[selectedOption]
    const isCorrect = selected.type === 'best'
    const isCorrectButBad = selected.type === 'correct_bad'

    setShowResult(true)
    
    if (isCorrect) {
      toast.success("🎉 Nice! That's the optimal solution!")
      saveScore({ correct: score.correct + 1, total: score.total + 1 })
    } else if (isCorrectButBad) {
      toast("✅ Works, but can you find the optimal one?", { icon: '💡' })
      saveScore({ correct: score.correct, total: score.total + 1 })
    } else {
      toast.error("❌ Not quite. Try again next time!")
      saveScore({ correct: score.correct, total: score.total + 1 })
    }
  }

  const renderNormalMode = () => {
    if (!problem) {
      return (
        <div className="text-zinc-500 text-center py-8">
          {loading ? 'Loading problem...' : 'Click "New Problem" to start'}
        </div>
      )
    }

    return (
      <>
        <h3 className="text-2xl font-bold text-zinc-100 mb-3">{problem.title}</h3>
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mb-4 ${difficultyColors[problem.difficulty] || 'bg-zinc-700 text-zinc-300'}`}>
          {problem.difficulty}
        </span>
        <div 
          className="description-content text-zinc-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: problem.description || '<p>No description available.</p>' }}
        />
      </>
    )
  }

  const renderQuizMode = () => {
    if (!problem) {
      return (
        <div className="text-zinc-500 text-center py-8">
          {loading ? 'Generating quiz...' : 'Click "New Problem" to start'}
        </div>
      )
    }

    if (!problem.options) {
      return (
        <div className="text-zinc-500 text-center py-8">
          {loading ? 'Generating quiz...' : 'Generating options...'}
        </div>
      )
    }

    return (
      <>
        <h3 className="text-2xl font-bold text-zinc-100 mb-3">{problem.title}</h3>
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mb-4 ${difficultyColors[problem.difficulty] || 'bg-zinc-700 text-zinc-300'}`}>
          {problem.difficulty}
        </span>
        <div 
          className="description-content text-zinc-300 leading-relaxed mb-6"
          dangerouslySetInnerHTML={{ __html: problem.description || '<p>No description available.</p>' }}
        />

        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-zinc-200">Select the best solution:</h4>
          {problem.options.map((option, index) => {
            const isSelected = selectedOption === index
            const showCorrect = showResult && option.type === problem.correctType
            const showWrong = showResult && isSelected && option.type !== problem.correctType

            return (
              <button
                key={index}
                onClick={() => !showResult && setSelectedOption(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected 
                    ? 'border-green-500 bg-green-500/10' 
                    : showCorrect
                      ? 'border-green-500 bg-green-500/20'
                      : showWrong
                        ? 'border-red-500 bg-red-500/20'
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`font-mono font-bold ${isSelected ? 'text-green-400' : 'text-zinc-400'}`}>
                    {option.label}
                  </span>
                  <pre className="font-mono text-xs text-zinc-300 overflow-x-auto flex-1 whitespace-pre-wrap">
                    {option.code}
                  </pre>
                </div>
              </button>
            )
          })}
        </div>

        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="mt-6 w-full bg-green-500 hover:bg-green-600 text-zinc-900 font-medium px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={fetchProblem}
            disabled={loading}
            className="mt-6 w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium px-4 py-3 rounded-lg transition-colors"
          >
            Next Question
          </button>
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Toaster position="top-center" />
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-zinc-200">
                  {gameMode ? 'Quiz' : 'Problem'}
                </h2>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-zinc-400">Quiz Mode</span>
                    <div 
                      onClick={() => setGameMode(!gameMode)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${gameMode ? 'bg-green-500' : 'bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${gameMode ? 'translate-x-7' : 'translate-x-1'}`} />
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-green-500"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <button
                  onClick={fetchProblem}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-zinc-900 font-medium px-4 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : gameMode ? 'New Quiz' : 'New Problem'}
                </button>
              </div>

              {gameMode && (
                <div className="mb-4 px-3 py-2 bg-zinc-800/50 rounded-lg flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Score</span>
                  <span className="font-mono font-bold text-green-400">
                    {score.correct} / {score.total}
                  </span>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {gameMode ? renderQuizMode() : renderNormalMode()}
            </div>
          </div>

          {!gameMode && (
            <div className="lg:w-1/2">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-200">Code</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Python</span>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap">
                    {problem?.pythonCode || '# Click "New Problem" to get starter code'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
