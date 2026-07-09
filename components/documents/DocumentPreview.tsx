// Renders AI/template-generated document text as an actual formatted page —
// markdown-style **bold**, *italics*, and #/##/### headings become real
// formatting instead of literal symbols, laid out like a document (serif,
// letter-width, paper card) instead of a monospace debug dump. Models don't
// reliably stick to one markdown style even when instructed, so this
// handles the common ones rather than fighting every prompt variation.
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

function renderLine(rawLine: string, key: number) {
  const line = rawLine.trim()
  if (line === '') return <div key={key} className="h-3" />

  const headingMatch = line.match(/^#{1,3}\s+(.+)$/)
  if (headingMatch) {
    return <p key={key} className="text-lg font-bold text-slate-900 mt-3 mb-1">{renderInline(headingMatch[1])}</p>
  }

  const isBoldHeading = /^\*\*.+\*\*$/.test(line) && line.length < 80
  if (isBoldHeading) {
    return <p key={key} className="text-center text-lg font-bold text-slate-900 mb-1">{renderInline(line)}</p>
  }

  return <p key={key} className="mb-1">{renderInline(line)}</p>
}

export function DocumentPreview({ content }: { content: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-10 py-8 max-w-2xl mx-auto font-serif text-[15px] text-slate-800 leading-relaxed">
      {content.split('\n').map((line, i) => renderLine(line, i))}
    </div>
  )
}
