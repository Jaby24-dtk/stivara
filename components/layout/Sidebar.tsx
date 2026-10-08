'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X, LayoutDashboard, Building2, CalendarClock, ListChecks, FileText, Sparkles, Settings } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Mission Control', icon: LayoutDashboard },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/compliance', label: 'Compliance', icon: CalendarClock },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const sidebarBg = { background: 'linear-gradient(180deg, #0B1220 0%, #0F1A2E 100%)' }

function Brand({ orgName }: { orgName: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, #E8C766, #C9A227)', boxShadow: '0 0 12px rgba(201,162,39,0.35)' }}
      >
        <span className="text-xs font-bold" style={{ color: 'var(--navy)' }}>S</span>
      </div>
      <div className="min-w-0">
        <p className="text-white font-semibold text-[15px] tracking-tight leading-tight">Stivara</p>
        <p className="text-slate-400 text-xs truncate leading-tight">{orgName}</p>
      </div>
    </div>
  )
}

// Desktop: fixed left sidebar. Mobile (<md): top bar with a menu button that
// opens the same nav as a slide-in drawer.
export function Sidebar({ userName, orgName }: { userName: string; orgName: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const nav = (
    <>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link ${pathname.startsWith(href) ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 pt-3 mt-3">
        <p className="text-slate-400 text-xs px-2 mb-2 truncate">{userName}</p>
      </div>
    </>
  )

  return (
    <>
      <header
        className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 h-14"
        style={sidebarBg}
      >
        <Brand orgName={orgName} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="p-2 -mr-2 rounded-lg text-slate-200 hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
      </header>

      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col p-4 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={sidebarBg}
        aria-hidden={!open}
      >
        <div className="px-2 py-3 mb-4 flex items-center justify-between gap-2">
          <Brand orgName={orgName} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="p-2 -mr-2 rounded-lg text-slate-200 hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        {nav}
      </aside>

      <aside className="hidden md:flex w-64 shrink-0 flex-col p-4 min-h-screen" style={sidebarBg}>
        <div className="px-2 py-3 mb-4">
          <Brand orgName={orgName} />
        </div>
        {nav}
      </aside>
    </>
  )
}
