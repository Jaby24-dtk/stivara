'use client'

import { Download } from 'lucide-react'

export function DownloadTextButton({ filename, content }: { filename: string; content: string }) {
  function handleDownload() {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button className="btn-secondary btn-sm" onClick={handleDownload}>
      <Download size={14} />
      Download
    </button>
  )
}
