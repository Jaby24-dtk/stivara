'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'

export function UploadDocumentButton({ companyId }: { companyId: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('companyId', companyId)

    const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Upload failed')
      return
    }
    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
  }

  return (
    <div>
      <button className="btn-secondary btn-sm" onClick={() => inputRef.current?.click()} disabled={loading}>
        <Upload size={14} />
        {loading ? 'Uploading…' : 'Upload document'}
      </button>
      <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
