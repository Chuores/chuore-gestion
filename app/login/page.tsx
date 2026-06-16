'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'


export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o contraseña incorrectos'); setLoading(false) }
    else router.push('/dashboard/inicio')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '420px 1fr', background: 'var(--bg)' }}>
      {/* Panel izquierdo */}
      <div style={{ background: 'var(--black)', padding: '0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* Gradiente rojo sutil */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(200,24,30,0.25) 0%, transparent 65%)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 44px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src="/logo.png" alt="CHUORE" style={{ width: '180px', height: '180px', objectFit: 'contain' }} />
          </div>
          
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'white', lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: '12px' }}>
              Tu negocio,<br />bajo control.
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
              Escandallos · Ventas · Gastos<br />
              Comparativa · Proveedores
            </p>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '24px 0' }} />
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)' }}>
              CHUORE Churros & More<br />
              Santiago de Compostela, Galicia
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '24px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '6px', letterSpacing: '-0.3px' }}>
            Bienvenido
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-4)', marginBottom: '32px' }}>
            Accede con tu email y contraseña.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" placeholder="tu@email.com" />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input" placeholder="••••••••" />
            </div>
            {error && (
              <div style={{ padding: '10px 12px', borderRadius: '7px', background: 'var(--c-red-bg)', color: 'var(--c-red)', fontSize: '13px', border: '1px solid var(--c-red-border)' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', borderRadius: '8px', marginTop: '4px' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
