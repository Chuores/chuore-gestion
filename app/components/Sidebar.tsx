'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const NAV = [
  { group: 'Inicio', items: [
    { href: '/dashboard/inicio', label: 'Inicio', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  ]},
  { group: 'Finanzas', items: [
    { href: '/dashboard/comparativa', label: 'Comparativa', d: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
    { href: '/dashboard/ventas', label: 'Ventas', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { href: '/dashboard/gastos', label: 'Gastos', d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  ]},
  { group: 'Operaciones', items: [
    { href: '/dashboard/proveedores', label: 'Proveedores', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { href: '/dashboard/pedidos', label: 'Pedidos', d: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  ]},
  { group: 'Escandallos', items: [
    { href: '/dashboard/escandallos/productos', label: 'Productos', d: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { href: '/dashboard/escandallos/materias-primas', label: 'Materias primas', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { href: '/dashboard/escandallos/packaging', label: 'Packaging', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ]},
]

function Icon({ d }: { d: string }) {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" style={{flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d={d}/></svg>
}

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = (href: string) => pathname === href || (href !== '/dashboard/inicio' && pathname.startsWith(href))
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'20px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <img src="/logo.png" alt="CHUORE" style={{width:'36px',height:'36px',objectFit:'contain',borderRadius:'6px'}}/>
          <p style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',letterSpacing:'0.12em',textTransform:'uppercase'}}>Panel de gestión</p>
        </div>
        {onClose && <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'20px',lineHeight:1,padding:'4px'}}>✕</button>}
      </div>
      <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>
        {NAV.map(section => (
          <div key={section.group} style={{marginBottom:'18px'}}>
            <p style={{fontSize:'9px',fontWeight:'700',color:'rgba(255,255,255,0.2)',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0 8px',marginBottom:'4px'}}>{section.group}</p>
            {section.items.map(item => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href} onClick={onClose} style={{textDecoration:'none',display:'block',marginBottom:'1px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'7px',background:active?'var(--red)':'transparent',color:active?'white':'rgba(255,255,255,0.45)',transition:'all 0.12s'}}>
                    <Icon d={item.d}/>
                    <span style={{fontSize:'13px',fontWeight:active?'600':'400'}}>{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div style={{padding:'10px 8px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <button onClick={async()=>{await supabase.auth.signOut();router.push('/login')}} style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'7px',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.28)',fontSize:'13px',fontFamily:'inherit'}}>
          <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <aside className="desktop-sidebar" style={{width:'var(--sidebar-w)',minHeight:'100vh',background:'var(--black)',display:'flex',flexDirection:'column',flexShrink:0,borderRight:'1px solid rgba(255,255,255,0.06)'}}>
        <NavContent/>
      </aside>
      <button className="mobile-menu-btn" onClick={()=>setOpen(true)} style={{position:'fixed',top:'12px',left:'12px',zIndex:60,width:'40px',height:'40px',borderRadius:'8px',background:'var(--black)',border:'1px solid rgba(255,255,255,0.1)',color:'white',cursor:'pointer',display:'none',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'4px'}}>
        <span style={{width:'16px',height:'2px',background:'white',borderRadius:'1px',display:'block'}}/>
        <span style={{width:'16px',height:'2px',background:'white',borderRadius:'1px',display:'block'}}/>
        <span style={{width:'16px',height:'2px',background:'white',borderRadius:'1px',display:'block'}}/>
      </button>
      {open && <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:70,backdropFilter:'blur(2px)'}}/>}
      <aside className="mobile-drawer" style={{position:'fixed',top:0,left:0,bottom:0,width:'260px',zIndex:80,background:'var(--black)',transform:open?'translateX(0)':'translateX(-100%)',transition:'transform 0.25s ease',display:'none',flexDirection:'column',borderRight:'1px solid rgba(255,255,255,0.08)'}}>
        <NavContent onClose={()=>setOpen(false)}/>
      </aside>
    </>
  )
}
