const Header = () => {
  return (
    <header className="shrink-0 z-20 border-b border-white/10 bg-[hsl(232_26%_12%/0.72)] backdrop-blur-xl supports-backdrop-filter:bg-[hsl(232_26%_12%/0.58)] animate-header-in">
      <div className="mx-auto flex h-14 w-full max-w-[1920px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="truncate font-mono text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">
            <span className="bg-linear-to-r from-amber-300 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
              rigged
            </span>
            <span className="text-zinc-200">code</span>
          </h1>
          <p className="hidden truncate text-xs font-medium tracking-wide text-zinc-400 sm:block">
            stitch patterns to memory
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-sky-200/90 md:inline-flex">
            Practice
          </span>
        </div>
      </div>
    </header>
  )
}

export default Header
