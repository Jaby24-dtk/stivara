'use client'

import { useEffect, useState } from 'react'

// The dashboard is server-rendered on Vercel (UTC), so the hour must come from
// the viewer's browser. Initial render uses Asia/Manila so server and client
// markup match; the effect then switches to the viewer's actual local time.
function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function manilaHour(): number {
  return Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Manila' }).format(new Date())
  )
}

export function Greeting() {
  const [text, setText] = useState(() => greetingFor(manilaHour()))

  useEffect(() => {
    setText(greetingFor(new Date().getHours()))
  }, [])

  return <>{text}</>
}
