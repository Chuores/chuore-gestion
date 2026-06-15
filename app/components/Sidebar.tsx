'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  {
    group: 'General',
    items: [
      { href: '/dashboard/inicio', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { href: '/dashboard/comparativa', label: 'Comparativa', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
    ]
  },
  {
    group: 'Finanzas',
    items: [
      { href: '/dashboard/ventas', label: 'Ventas', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { href: '/dashboard/gastos', label: 'Gastos', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    ]
  },
  {
    group: 'Escandallos',
    items: [
      { href: '/dashboard/escandallos/productos', label: 'Productos', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
      { href: '/dashboard/escandallos/materias-primas', label: 'Materias primas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { href: '/dashboard/escandallos/packaging', label: 'Packaging', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    ]
  },
  {
    group: 'Maestros',
    items: [
      { href: '/dashboard/proveedores', label: 'Proveedores', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    ]
  },
]

function SvgIcon({ d, size = 14, color = 'currentColor' }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.7" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const active = (href: string) =>
    pathname === href || (href !== '/dashboard/inicio' && pathname.startsWith(href))

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minHeight: '100vh',
      background: 'var(--c-espresso)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--c-gold) 0%, #7A5608 100%)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '15px', fontWeight: '600', color: 'white', letterSpacing: '0.05em', lineHeight: 1 }}>CHUORE</p>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>Gestión</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(section => (
          <div key={section.group} style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '4px' }}>
              {section.group}
            </p>
            {section.items.map(item => {
              const isActive = active(item.href)
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block', marginBottom: '1px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 8px', borderRadius: '7px',
                    background: isActive ? 'rgba(184,134,11,0.14)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--c-gold)' : '2px solid transparent',
                    transition: 'all 0.1s',
                  }}>
                    <SvgIcon d={item.icon} color={isActive ? 'var(--c-gold)' : 'rgba(255,255,255,0.32)'} />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.42)',
                      letterSpacing: '0.01em',
                    }}>
                      {item.label}
                    </span>
                    {isActive && <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--c-gold)', flexShrink: 0 }} />}
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderRadius: '7px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', fontSize: '13px', fontFamily: 'inherit', transition: 'color 0.1s' }}
        >
          <SvgIcon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" color="currentColor" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
