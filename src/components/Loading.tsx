export function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="w-full min-h-[50vh] flex items-center justify-center" role="status">
      <div className="flex items-center gap-2 text-sm text-secondary">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
        <span>{text}</span>
      </div>
    </div>
  )
}

export default Loading
