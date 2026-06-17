'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '../components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (window.innerWidth < 768) setOpen(false)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '20px', height: '20px', border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {open && <div onClick={() => setOpen(false)} style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} id="overlay" />}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '220px', transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', zIndex: 50 }}>
        <Sidebar onClose={() => setOpen(false)} />
      </div>
      <button onClick={() => setOpen(!open)} style={{ position: 'fixed', top: '14px', left: open ? '228px' : '14px', transition: 'left 0.25s ease', zIndex: 60, width: '36px', height: '36px', borderRadius: '8px', background: 'var(--black)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        {open ? '✕' : '☰'}
      </button>
      <main style={{ flex: 1, marginLeft: open ? '220px' : '0', transition: 'margin-left 0.25s ease', padding: '60px 28px 28px', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
