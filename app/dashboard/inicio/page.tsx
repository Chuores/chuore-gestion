'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const euro = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

export default function InicioPage() {
  const [data, setData] = useState({ ventas: 0, gastos: 0, productos: 0, proveedores: 0 })
  const [chart, setChart] = useState<{ label: string; ventas: number; gastos: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const ini = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const [v, g, p, pr] = await Promise.all([
        supabase.from('ventas').select('total').gte('fecha', ini).lte('fecha', fin),
        supabase.from('gastos').select('importe').gte('fecha', ini).lte('fecha', fin),
        supabase.from('productos').select('id', { count: 'exact', head: true }),
        supabase.from('proveedores').select('id', { count: 'exact', head: true }),
      ])
      const ventas = (v.data || []).reduce((s, x) => s + x.total, 0)
      const gastos = (g.data || []).reduce((s, x) => s + x.importe, 0)
      setData({ ventas, gastos, productos: p.count || 0, proveedores: pr.count || 0 })

      const meses = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mi = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
        const mf = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
        const [mv, mg] = await Promise.all([
          supabase.from('ventas').select('total').gte('fecha', mi).lte('fecha', mf),
          supabase.from('gastos').select('importe').gte('fecha', mi).lte('fecha', mf),
        ])
        meses.push({
          label: d.toLocaleDateString('es-ES', { month: 'short' }),
          ventas: (mv.data || []).reduce((s, x) => s + x.total, 0),
          gastos: (mg.data || []).reduce((s, x) => s + x.importe, 0),
        })
      }
      setChart(meses)
      setLoading(false)
    }
    load()
  }, [])

  const beneficio = data.ventas - data.gastos
  const margen = data.ventas > 0 ? (beneficio / data.ventas) * 100 : 0
  const maxVal = Math.max(...chart.map(m => Math.max(m.ventas, m.gastos)), 1)
  const mesActual = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <div className="fade-in" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inicio</h1>
          <p className="page-subtitle">Resumen de {mesActual} · CHUORE Churros & More</p>
        </div>
        <Link href="/dashboard/comparativa" className="btn btn-ghost btn-sm" style={{ gap: '5px' }}>
          Ver comparativa →
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Ventas del mes', value: euro(data.ventas), color: 'var(--c-green)', sub: 'Total registrado' },
          { label: 'Gastos del mes', value: euro(data.gastos), color: 'var(--c-red)', sub: 'Todos los conceptos' },
          { label: 'Beneficio estimado', value: euro(beneficio), color: beneficio >= 0 ? 'var(--c-green)' : 'var(--c-red)', sub: 'Ventas menos gastos' },
          { label: 'Margen', value: `${margen.toFixed(1)}%`, color: margen >= 20 ? 'var(--c-green)' : margen >= 10 ? 'var(--c-amber)' : 'var(--c-red)', sub: 'Sobre ventas del mes' },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <p className="stat-label">{k.label}</p>
            <p className="stat-value mono" style={{ color: loading ? 'var(--c-text-4)' : k.color, fontSize: '20px' }}>
              {loading ? '—' : k.value}
            </p>
            <p className="stat-sub">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '14px', marginBottom: '14px' }}>
        <div className="card">
          <div className="card-header">
            <p className="card-title">Ventas vs Gastos — últimos 6 meses</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[{ label: 'Ventas', color: 'var(--c-green)' }, { label: 'Gastos', color: 'var(--c-red)' }].map(l => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--c-text-3)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color, opacity: 0.7, display: 'inline-block' }} />{l.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ padding: '20px 20px 12px' }}>
            {loading ? (
              <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '12px', color: 'var(--c-text-4)' }}>Cargando...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '130px', paddingBottom: '24px', position: 'relative' }}>
                {[0, 33, 66, 100].map(p => (
                  <div key={p} style={{ position: 'absolute', bottom: `calc(24px + ${p / 100 * 106}px)`, left: 0, right: 0, borderTop: '1px solid var(--c-surface-3)', zIndex: 0 }} />
                ))}
                {chart.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '100%', display: 'flex', gap: '3px', alignItems: 'flex-end', height: '106px' }}>
                      <div style={{ flex: 1, background: 'var(--c-green)', opacity: 0.75, borderRadius: '3px 3px 0 0', height: `${(m.ventas / maxVal) * 100}%`, minHeight: m.ventas > 0 ? '3px' : '0', transition: 'height 0.4s ease' }} />
                      <div style={{ flex: 1, background: 'var(--c-red)', opacity: 0.55, borderRadius: '3px 3px 0 0', height: `${(m.gastos / maxVal) * 100}%`, minHeight: m.gastos > 0 ? '3px' : '0', transition: 'height 0.4s ease' }} />
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--c-text-4)', position: 'absolute', bottom: '0', textTransform: 'capitalize' }}>{m.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <p className="section-label" style={{ marginBottom: '10px' }}>Catálogo</p>
            {[{ label: 'Productos', val: data.productos }, { label: 'Proveedores', val: data.proveedores }].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--c-surface-3)' }}>
                <span style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>{r.label}</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--c-text-1)' }}>{r.val}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/comparativa" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#FBF0D8', border: '1px solid #E8D099', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(184,134,11,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-gold)', marginBottom: '4px' }}>Comparativa 2025 vs 2026</p>
              <p style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>Análisis completo de ventas diarias</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="card">
        <div className="card-header"><p className="card-title">Accesos rápidos</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {[
            { href: '/dashboard/ventas', label: 'Registrar venta de hoy', desc: 'Anota el total del TPV' },
            { href: '/dashboard/gastos', label: 'Registrar gasto', desc: 'Materias primas, alquiler, luz...' },
            { href: '/dashboard/escandallos/productos', label: 'Ver escandallos', desc: 'Márgenes y costes por producto' },
            { href: '/dashboard/proveedores', label: 'Gestionar proveedores', desc: 'Fichas de contacto y notas' },
          ].map((item, i) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '14px 18px',
                borderRight: i % 2 === 0 ? '1px solid var(--c-surface-3)' : 'none',
                borderBottom: i < 2 ? '1px solid var(--c-surface-3)' : 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text-1)', marginBottom: '2px' }}>{item.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>{item.desc}</p>
                </div>
                <svg width="14" height="14" fill="none" stroke="var(--c-border-2)" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
