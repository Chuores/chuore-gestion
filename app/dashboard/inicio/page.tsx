'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const euro = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

export default function InicioPage() {
  const [stats, setStats] = useState({ ventasMes: 0, gastosMes: 0, productos: 0, proveedores: 0 })
  const [meses, setMeses] = useState<{ label: string; ventas: number; gastos: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const ahora = new Date()
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0]
      const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().split('T')[0]

      const [ventas, gastos, prods, provs] = await Promise.all([
        supabase.from('ventas').select('total').gte('fecha', inicioMes).lte('fecha', finMes),
        supabase.from('gastos').select('importe').gte('fecha', inicioMes).lte('fecha', finMes),
        supabase.from('productos').select('id', { count: 'exact', head: true }),
        supabase.from('proveedores').select('id', { count: 'exact', head: true }),
      ])

      const ventasMes = (ventas.data || []).reduce((s, v) => s + v.total, 0)
      const gastosMes = (gastos.data || []).reduce((s, g) => s + g.importe, 0)
      setStats({ ventasMes, gastosMes, productos: prods.count || 0, proveedores: provs.count || 0 })

      const mesesData = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
        const ini = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
        const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
        const [v, g] = await Promise.all([
          supabase.from('ventas').select('total').gte('fecha', ini).lte('fecha', fin),
          supabase.from('gastos').select('importe').gte('fecha', ini).lte('fecha', fin),
        ])
        mesesData.push({
          label: d.toLocaleDateString('es-ES', { month: 'short' }),
          ventas: (v.data || []).reduce((s, x) => s + x.total, 0),
          gastos: (g.data || []).reduce((s, x) => s + x.importe, 0),
        })
      }
      setMeses(mesesData)
      setLoading(false)
    }
    load()
  }, [])

  const beneficio = stats.ventasMes - stats.gastosMes
  const margen = stats.ventasMes > 0 ? (beneficio / stats.ventasMes) * 100 : 0
  const maxVal = Math.max(...meses.map(m => Math.max(m.ventas, m.gastos)), 1)
  const mesActual = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <div className="fade-in" style={{ maxWidth: '920px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', letterSpacing: '-0.3px', marginBottom: '3px' }}>Inicio</h1>
        <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Resumen de {mesActual} · CHUORE Churros & More</p>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        <div className="stat-card">
          <p className="stat-label">Ventas del mes</p>
          <p className="stat-value" style={{ color: '#059669' }}>{loading ? '—' : euro(stats.ventasMes)}</p>
          <p className="stat-sub">Registradas en el TPV</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Gastos del mes</p>
          <p className="stat-value" style={{ color: '#DC2626' }}>{loading ? '—' : euro(stats.gastosMes)}</p>
          <p className="stat-sub">Todos los conceptos</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Beneficio estimado</p>
          <p className="stat-value" style={{ color: beneficio >= 0 ? '#059669' : '#DC2626' }}>
            {loading ? '—' : euro(beneficio)}
          </p>
          <p className="stat-sub">Ventas menos gastos</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Margen</p>
          <p className="stat-value" style={{ color: margen >= 20 ? '#059669' : margen >= 10 ? '#D97706' : '#DC2626' }}>
            {loading ? '—' : `${margen.toFixed(1)}%`}
          </p>
          <p className="stat-sub">Sobre ventas del mes</p>
        </div>
      </div>

      {/* Chart + Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '14px', marginBottom: '14px' }}>
        {/* Chart */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Ventas vs Gastos — últimos 6 meses</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6B7280' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#059669', display: 'inline-block' }} />Ventas
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6B7280' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#DC2626', opacity: 0.6, display: 'inline-block' }} />Gastos
              </span>
            </div>
          </div>
          <div style={{ padding: '20px 20px 12px' }}>
            {loading ? (
              <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Cargando...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '140px', paddingBottom: '24px', position: 'relative' }}>
                {[0, 33, 66, 100].map(p => (
                  <div key={p} style={{ position: 'absolute', bottom: `calc(24px + ${p / 100 * 116}px)`, left: 0, right: 0, borderTop: '1px dashed #F3F4F6', zIndex: 0 }} />
                ))}
                {meses.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '100%', display: 'flex', gap: '3px', alignItems: 'flex-end', height: '116px' }}>
                      <div style={{ flex: 1, backgroundColor: '#059669', borderRadius: '3px 3px 0 0', height: `${(m.ventas / maxVal) * 100}%`, minHeight: m.ventas > 0 ? '3px' : '0', transition: 'height 0.4s ease' }} />
                      <div style={{ flex: 1, backgroundColor: '#DC2626', opacity: 0.6, borderRadius: '3px 3px 0 0', height: `${(m.gastos / maxVal) * 100}%`, minHeight: m.gastos > 0 ? '3px' : '0', transition: 'height 0.4s ease' }} />
                    </div>
                    <p style={{ fontSize: '10px', color: '#9CA3AF', position: 'absolute', bottom: '0', textTransform: 'capitalize' }}>{m.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <p className="section-label" style={{ marginBottom: '12px' }}>Catálogo</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Productos</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{stats.productos}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Proveedores</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{stats.proveedores}</span>
            </div>
          </div>
          <Link href="/dashboard/comparativa" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '16px', cursor: 'pointer', borderColor: '#B8860B20', backgroundColor: '#FFFBEB' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#B8860B', marginBottom: '4px' }}>Ver comparativa 2025 vs 2026</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF' }}>Análisis completo de ventas diarias</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="card">
        <div className="card-header">
          <p className="card-title">Accesos rápidos</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
          {[
            { href: '/dashboard/ventas', label: 'Registrar venta de hoy', desc: 'Anota el total del TPV' },
            { href: '/dashboard/gastos', label: 'Registrar gasto', desc: 'Materias primas, alquiler, luz...' },
            { href: '/dashboard/escandallos/productos', label: 'Ver escandallos', desc: 'Márgenes y costes por producto' },
            { href: '/dashboard/proveedores', label: 'Gestionar proveedores', desc: 'Fichas de contacto y notas' },
          ].map((item, i) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '14px 18px',
                borderRight: i % 2 === 0 ? '1px solid #F3F4F6' : 'none',
                borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none',
                cursor: 'pointer',
                transition: 'background-color 0.1s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827', marginBottom: '2px' }}>{item.label}</p>
                  <p style={{ fontSize: '11px', color: '#9CA3AF' }}>{item.desc}</p>
                </div>
                <svg width="14" height="14" fill="none" stroke="#D1D5DB" strokeWidth="2" viewBox="0 0 24 24">
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
