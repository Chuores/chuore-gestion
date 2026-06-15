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
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '400px 1fr', background: 'var(--c-bg)' }}>
      {/* Left — brand panel */}
      <div style={{
        background: 'var(--c-espresso)',
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(184,134,11,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          {/* Logo mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '52px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, var(--c-gold) 0%, #8B6508 100%)',
              borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '18px', fontWeight: '600', color: 'white', letterSpacing: '0.06em', lineHeight: 1 }}>CHUORE</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '2px' }}>Gestión</p>
            </div>
          </div>

          <h2 style={{ fontSize: '30px', fontWeight: '700', color: 'white', lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: '16px' }}>
            Tu negocio,<br />bajo control.
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>
            Escandallos · Ventas · Gastos<br />
            Comparativa · Proveedores
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '20px' }} />
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.03em' }}>
            CHUORE Churros & More<br />
            Santiago de Compostela, Galicia
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: '600', color: 'var(--c-text-1)', marginBottom: '6px', letterSpacing: '-0.3px' }}>
            Bienvenido
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--c-text-4)', marginBottom: '32px' }}>
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
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px', borderRadius: '8px', marginTop: '4px' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
