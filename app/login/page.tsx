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
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '420px 1fr', backgroundColor: '#F9FAFB' }}>
      {/* Left panel */}
      <div style={{ backgroundColor: '#111827', padding: '52px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#B8860B', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'white', opacity: 0.9 }} />
            </div>
            <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '18px', fontWeight: '600', color: 'white', letterSpacing: '0.04em' }}>CHUORE</span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'white', lineHeight: 1.2, marginBottom: '14px', letterSpacing: '-0.5px' }}>
            Panel de<br />gestión
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
            Escandallos · Ventas · Gastos<br />
            Comparativa · Proveedores
          </p>
        </div>
        <div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {['Escandallos', 'Ventas', 'Gastos', 'Análisis', 'Proveedores'].map(tag => (
              <span key={tag} style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {tag}
              </span>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Santiago de Compostela, Galicia</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '6px', letterSpacing: '-0.3px' }}>
            Acceder
          </h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '32px' }}>
            Introduce tus credenciales para continuar.
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
              <div style={{ padding: '10px 12px', borderRadius: '7px', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '13px', border: '1px solid #FECACA' }}>
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
