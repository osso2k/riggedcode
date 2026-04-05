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

const difficultyStyles: Record<string, string> = {
  Easy: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200 shadow-[0_0_24px_-10px_rgba(52,211,153,0.35)]',
  Medium: 'border-amber-400/35 bg-amber-500/14 text-amber-100',
  Hard: 'border-fuchsia-400/35 bg-fuchsia-500/14 text-fuchsia-100'
}

const panelClass =
  'relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/35 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-md transition-[box-shadow,transform] duration-300 ease-out hover:shadow-[0_12px_40px_-16px_rgba(56,189,248,0.12)]'

const primaryBtn =
  'rounded-lg bg-linear-to-r from-sky-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(56,189,248,0.45)] transition-all duration-200 hover:from-sky-400 hover:to-fuchsia-400 disabled:opacity-50 motion-safe:active:scale-[0.98]'

const spinBorder = 'border-2 border-sky-500/25 border-t-sky-400'

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
      toast.success("Nice — that's the optimal solution.")
      saveScore({ correct: score.correct + 1, total: score.total + 1 })
    } else if (isCorrectButBad) {
      toast('Works, but can you find the optimal one?', { icon: '💡' })
      saveScore({ correct: score.correct, total: score.total + 1 })
    } else {
      toast.error('Not quite. Try again next time.')
      saveScore({ correct: score.correct, total: score.total + 1 })
    }
  }

  const problemKey = problem ? `${problem.title}-${gameMode}` : 'empty'

  const renderProblemHeader = () => {
    if (!problem) return null
    return (
      <div className="shrink-0 space-y-3 border-b border-white/10 bg-black/15 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="pr-2 text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">{problem.title}</h3>
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficultyStyles[problem.difficulty] || 'border-white/15 bg-white/5 text-zinc-200'}`}
          >
            {problem.difficulty}
          </span>
        </div>
      </div>
    )
  }

  const renderDescription = (className = '') => (
    <div
      className={`description-content text-[15px] leading-relaxed text-zinc-300/95 ${className}`}
      dangerouslySetInnerHTML={{ __html: problem?.description || '<p>No description available.</p>' }}
    />
  )

  const renderNormalBody = () => {
    if (!problem) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-zinc-400">
          {loading ? (
            <>
              <span className={`inline-block h-8 w-8 animate-spin rounded-full ${spinBorder}`} aria-hidden />
              <span>Loading problem…</span>
            </>
          ) : (
            <span>Click &ldquo;New Problem&rdquo; to start</span>
          )}
        </div>
      )
    }

    return (
      <div key={problemKey} className="animate-panel-in flex min-h-0 flex-1 flex-col">
        {renderProblemHeader()}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{renderDescription()}</div>
      </div>
    )
  }

  const renderQuizLeft = () => {
    if (!problem) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-zinc-400">
          {loading ? (
            <>
              <span className={`inline-block h-8 w-8 animate-spin rounded-full ${spinBorder}`} aria-hidden />
              <span>Generating quiz…</span>
            </>
          ) : (
            <span>Click &ldquo;New Quiz&rdquo; to start</span>
          )}
        </div>
      )
    }

    if (!problem.options) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-zinc-400">
          {loading ? (
            <>
              <span className={`inline-block h-8 w-8 animate-spin rounded-full ${spinBorder}`} aria-hidden />
              <span>Generating options…</span>
            </>
          ) : (
            <span>Preparing question…</span>
          )}
        </div>
      )
    }

    return (
      <div key={problemKey} className="animate-panel-in flex min-h-0 flex-1 flex-col">
        {renderProblemHeader()}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{renderDescription()}</div>
      </div>
    )
  }

  const renderQuizRight = () => {
    if (!problem?.options) {
      return (
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-zinc-500">
          {loading ? null : '—'}
        </div>
      )
    }

    return (
      <div key={`${problemKey}-opts`} className="animate-panel-in-delayed flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-white/10 bg-black/15 px-5 py-4 sm:px-6">
          <h4 className="text-sm font-medium uppercase tracking-wider text-sky-200/80">Select the best solution</h4>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
          {problem.options.map((option, index) => {
            const isSelected = selectedOption === index
            const showCorrect = showResult && option.type === problem.correctType
            const showWrong = showResult && isSelected && option.type !== problem.correctType

            return (
              <button
                key={index}
                type="button"
                onClick={() => !showResult && setSelectedOption(index)}
                disabled={showResult}
                className={`group w-full rounded-xl border text-left transition-all duration-200 ease-out motion-safe:active:scale-[0.99] ${
                  isSelected && !showResult
                    ? 'border-sky-400/45 bg-sky-500/15 shadow-[0_0_28px_-12px_rgba(56,189,248,0.35)]'
                    : showCorrect
                      ? 'border-emerald-400/50 bg-emerald-500/15'
                      : showWrong
                        ? 'border-rose-400/45 bg-rose-500/12'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                }`}
              >
                <div className="flex items-start gap-3 p-3.5 sm:p-4">
                  <span
                    className={`font-mono text-xs font-bold tabular-nums transition-colors duration-200 ${
                      isSelected ? 'text-sky-300' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  >
                    {option.label}
                  </span>
                  <pre className="flex-1 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-200 sm:text-xs">
                    {option.code}
                  </pre>
                </div>
              </button>
            )
          })}
        </div>
        <div className="shrink-0 border-t border-white/10 bg-black/20 p-4 sm:p-5">
          {!showResult ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="w-full rounded-xl bg-linear-to-r from-sky-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_28px_-8px_rgba(192,132,252,0.45)] transition-all duration-200 hover:from-sky-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none motion-safe:active:scale-[0.98]"
            >
              Submit answer
            </button>
          ) : (
            <button
              type="button"
              onClick={fetchProblem}
              disabled={loading}
              className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-medium text-zinc-50 transition-all duration-200 hover:bg-white/12 disabled:opacity-50 motion-safe:active:scale-[0.98]"
            >
              Next question
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderCodePanel = () => (
    <div key={problemKey + '-code'} className="animate-panel-in-delayed flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 bg-black/15 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-medium text-sky-200/90">Starter code</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fuchsia-200/70">Python</span>
          <span
            className="h-2 w-2 rounded-full bg-linear-to-r from-sky-400 to-fuchsia-400 ring-2 ring-sky-400/30"
            title="Active"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-slate-950/50 p-4 sm:p-5">
        <pre className="selection:bg-fuchsia-500/25 selection:text-fuchsia-50 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-zinc-300 sm:text-sm">
          {problem?.pythonCode || '# Click "New Problem" for starter code'}
        </pre>
      </div>
    </div>
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden text-zinc-100">
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            '!border !border-white/12 !bg-slate-900/95 !text-sm !text-zinc-100 !shadow-2xl !backdrop-blur-md !rounded-xl',
          duration: 3200
        }}
      />
      <Header />

      <div className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col gap-3 px-3 pb-3 pt-2 sm:gap-4 sm:px-5 sm:pb-4 lg:px-8">
        <div className="animate-panel-in flex shrink-0 flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/30 px-3 py-3 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="sr-only" htmlFor="difficulty">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-lg border border-white/15 bg-slate-950/60 py-2 pl-3 pr-8 text-sm text-zinc-100 outline-none transition-[border-color,box-shadow] duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button type="button" onClick={fetchProblem} disabled={loading} className={primaryBtn}>
              {loading ? 'Loading…' : gameMode ? 'New quiz' : 'New problem'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
            {gameMode && (
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5">
                <span className="text-xs font-medium text-zinc-400">Score</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-amber-300">
                  {score.correct} / {score.total}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setGameMode(!gameMode)}
              className="flex items-center gap-3 rounded-lg border border-transparent px-1 py-1 text-sm text-zinc-300 transition-colors hover:text-white"
              aria-pressed={gameMode}
            >
              <span className="select-none">Quiz mode</span>
              <span
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-out ${gameMode ? 'bg-linear-to-r from-sky-500 to-fuchsia-500' : 'bg-slate-600'}`}
              >
                <span
                  className={`pointer-events-none absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${gameMode ? 'translate-x-[22px]' : 'translate-x-0'}`}
                />
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="animate-panel-in shrink-0 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          >
            {error}
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2 xl:grid-rows-1 xl:gap-5">
          <section className={panelClass}>{gameMode ? renderQuizLeft() : renderNormalBody()}</section>

          <section className={panelClass}>{gameMode ? renderQuizRight() : renderCodePanel()}</section>
        </div>
      </div>
    </div>
  )
}

export default App
