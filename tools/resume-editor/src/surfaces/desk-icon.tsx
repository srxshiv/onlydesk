import type { FC } from 'react'

export const DeskIcon: FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 transition-transform hover:scale-105" aria-label="Open Resume Editor">
    <div className="h-20 w-16 rounded-sm bg-amber-700 shadow-lg shadow-amber-900/40 ring-1 ring-amber-900/60" />
    <span className="text-xs text-amber-100/80">Resume</span>
  </button>
)

export default DeskIcon
