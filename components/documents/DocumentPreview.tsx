// Renders AI/template-generated document text as an actual formatted page —
// markdown-style **bold** becomes real bold instead of literal asterisks,
// and it's laid out like a document (serif, letter-width, paper card)
// instead of a monospace debug dump.
function renderLine(line: string, key: number) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  const isHeading = /^\*\*.+\*\*$/.test(line.trim()) && line.trim().length < 80

  const content = parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  )

  if (line.trim() === '') return <div key={key} className="h-3" />
  if (isHeading) return <p key={key} className="text-center font-semibold text-slate-900 mb-1">{content}</p>

  return <p key={key} className="mb-1">{content}</p>
}

export function DocumentPreview({ content }: { content: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-10 py-8 max-w-2xl mx-auto font-serif text-[15px] text-slate-800 leading-relaxed">
      {content.split('\n').map((line, i) => renderLine(line, i))}
    </div>
  )
}
