import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trust Center — Stivara',
  description: "Stivara's security, privacy, and compliance posture.",
}

const LAST_UPDATED = '9 July 2026'

const live = [
  {
    title: 'Encryption in transit & at rest',
    body: 'All connections use TLS. Data at rest is encrypted by our infrastructure providers (Supabase/Postgres, Vercel).',
  },
  {
    title: 'Tenant isolation',
    body: 'Every table is protected by Postgres Row Level Security scoped to your organization — one tenant can never query another’s rows.',
  },
  {
    title: 'Private document storage',
    body: 'Uploaded documents live in a private storage bucket. Access is granted only to authenticated members of your organization.',
  },
  {
    title: 'Role-based accounts',
    body: 'Every user has an explicit role (super admin, practice staff, client admin, client user) that scopes what they can see and do.',
  },
]

const roadmap = [
  {
    title: 'Per-company access control',
    body: 'Today, any member of your organization can see all companies in it. Fine-grained per-company staff permissions are on the roadmap.',
  },
  {
    title: 'Full audit trail',
    body: 'A record of who viewed, edited, or downloaded what, and when, is planned but not yet implemented.',
  },
  {
    title: 'SOC 2 Type II',
    body: 'Not yet started. We are not precluding this architecturally, but no certification exists today — don’t take this page as a claim otherwise.',
  },
  {
    title: 'ISO 27001',
    body: 'Same as above: on the long-term roadmap once we have paying enterprise clients, not certified today.',
  },
]

const jurisdictions = [
  { region: 'Singapore', law: 'PDPA', note: 'Data handling commitments for SG-incorporated client companies are being built into the platform; cross-border transfer rules are still being confirmed.' },
  { region: 'Malaysia', law: 'PDPA', note: 'Same status as Singapore — architecture supports jurisdiction-scoped data, specific residency guarantees are not yet finalized.' },
  { region: 'Philippines', law: 'Data Privacy Act (NPC)', note: 'Same status — not yet a finalized, audited commitment.' },
  { region: 'South Korea', law: 'PIPA', note: 'Lightest-touch jurisdiction in our current build; residency and processing terms are still being worked out.' },
]

const subprocessors = [
  { name: 'Supabase', purpose: 'Primary database (Postgres), authentication, and file storage' },
  { name: 'Vercel', purpose: 'Application hosting and compute' },
  { name: 'Anthropic', purpose: 'AI model provider for the AI Company Secretary chat and document Q&A' },
  { name: 'Voyage AI', purpose: 'Generates the embeddings used for document search' },
]

export default function TrustCenterPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-slate-900">Stivara</Link>
          <Link href="/login" className="text-sm font-medium text-teal-700">Sign in</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 flex flex-col gap-16">
        <section>
          <p className="text-sm font-medium text-teal-700 mb-3">Trust Center</p>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight mb-4">
            Security &amp; compliance, plainly stated
          </h1>
          <p className="text-slate-600 max-w-2xl leading-relaxed">
            Stivara is early-stage software. This page tells you exactly what is true about our security
            posture today, and what is still on the roadmap — no certifications we don&apos;t hold, no
            guarantees we can&apos;t back up.
          </p>
          <p className="text-xs text-slate-400 mt-4">Last updated {LAST_UPDATED}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Live today</h2>
          <p className="text-sm text-slate-500 mb-5">What&apos;s actually implemented in the product right now.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {live.map((item) => (
              <div key={item.title} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-success">live</span>
                  <h3 className="font-medium text-slate-900">{item.title}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">On the roadmap</h2>
          <p className="text-sm text-slate-500 mb-5">Not built yet — flagged here so you can plan around it, not discover it the hard way.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {roadmap.map((item) => (
              <div key={item.title} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-warning">planned</span>
                  <h3 className="font-medium text-slate-900">{item.title}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Data privacy by jurisdiction</h2>
          <p className="text-sm text-slate-500 mb-5">
            Stivara currently supports Singapore, Malaysia, the Philippines, and South Korea. Regulatory
            posture for each is still maturing — treat this as status, not a compliance certification.
          </p>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-5 font-medium">Jurisdiction</th>
                  <th className="py-3 px-5 font-medium">Framework</th>
                  <th className="py-3 px-5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {jurisdictions.map((j) => (
                  <tr key={j.region} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-5 font-medium text-slate-900 align-top">{j.region}</td>
                    <td className="py-3 px-5 text-slate-600 align-top whitespace-nowrap">{j.law}</td>
                    <td className="py-3 px-5 text-slate-600 leading-relaxed">{j.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">AI &amp; your data</h2>
          <p className="text-sm text-slate-500 mb-5">
            The AI Assistant only sends data to a model provider when you actively ask it a question or
            upload a document for indexing — nothing is scanned or sent in the background.
          </p>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-5 font-medium">Subprocessor</th>
                  <th className="py-3 px-5 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {subprocessors.map((s) => (
                  <tr key={s.name} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-5 font-medium text-slate-900">{s.name}</td>
                    <td className="py-3 px-5 text-slate-600">{s.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Formal data processing agreements with each subprocessor are not yet in place — this is
            tracked as part of the security roadmap above.
          </p>
        </section>

        <section className="card p-8 text-center bg-[#0F172A]">
          <h2 className="text-white font-semibold text-lg mb-2">Have a security question?</h2>
          <p className="text-slate-300 text-sm mb-1">
            Email{' '}
            <a href="mailto:director@iamstivai.com" className="text-teal-300 font-medium">
              director@iamstivai.com
            </a>{' '}
            and we&apos;ll get you a straight answer.
          </p>
        </section>
      </main>
    </div>
  )
}
