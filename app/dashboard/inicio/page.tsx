'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const euro = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
const r2 = (n: number) => Math.round(n * 100) / 100
const sgn = (n: number) => n >= 0 ? '+' : ''

type DayMap = Record<string, number>

export default function InicioPage() {
  const [loading, setLoading] = useState(true)
  const [d25, setD25] = useState<DayMap>({})
  const [d26, setD26] = useState<DayMap>({})
  const [chart, setChart] = useState<{ label: string; v25: number; v26: number }[]>([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('ventas').select('fecha, total').order('fecha')
      if (!data) return

      const map25: DayMap = {}, map26: DayMap = {}
      data.forEach(({ fecha, total }) => {
        const f = String(fecha).slice(0, 10)
        if (f.startsWith('2025')) map25[f] = Number(total)
        if (f.startsWith('2026')) map26[f] = Number(total)
      })
      setD25(map25)
      setD26(map26)

      // Gráfico últimos 6 meses
      const now = new Date()
      const meses = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const y26 = d.getFullYear(); const m26 = String(d.getMonth() + 1).padStart(2, '0')
        const y25 = y26 - 1; const m25 = m26
        const pre26 = `${y26}-${m26}`
        const pre25 = `${y25}-${m25}`

        // Para comparación equitativa: limitar 2025 al mismo número de días que 2026
        const dias26 = Object.keys(map26).filter(k => k.startsWith(pre26)).length
        const v26 = Object.entries(map26).filter(([k]) => k.startsWith(pre26)).reduce((s, [, v]) => s + v, 0)
        const v25entries = Object.entries(map25).filter(([k]) => k.startsWith(pre25)).sort(([a], [b]) => a.localeCompare(b))
        const v25 = v25entries.slice(0, dias26 || v25entries.length).reduce((s, [, v]) => s + v, 0)

        meses.push({ label: d.toLocaleDateString('es-ES', { month: 'short' }), v25, v26 })
      }
      setChart(meses)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayEquiv25 = `2025-${today.slice(5)}`

  // Mes actual
  const mesActual = today.slice(0, 7) // 2026-06
  const mesEquiv25 = `2025-${today.slice(5, 7)}` // 2025-06

  // Ventas mes actual 2026
  const ventasMes26 = Object.entries(d26).filter(([k]) => k.startsWith(mesActual)).reduce((s, [, v]) => s + v, 0)
  const diasMes26 = Object.keys(d26).filter(k => k.startsWith(mesActual)).length

  // Ventas mismo mes 2025 — hasta el mismo día
  const diaActual = parseInt(today.slice(8))
  const ventasMes25 = Object.entries(d25)
    .filter(([k]) => k.startsWith(mesEquiv25) && parseInt(k.slice(8)) <= diaActual)
    .reduce((s, [, v]) => s + v, 0)
  const diasMes25 = Object.keys(d25).filter(k => k.startsWith(mesEquiv25) && parseInt(k.slice(8)) <= diaActual).length

  const mediaMes26 = diasMes26 > 0 ? r2(ventasMes26 / diasMes26) : 0
  const mediaMes25 = diasMes25 > 0 ? r2(ventasMes25 / diasMes25) : 0
  const pctMes = mediaMes25 > 0 ? (((mediaMes26 - mediaMes25) / mediaMes25) * 100) : 0
  const posMes = pctMes >= 0

  // YTD real — mismo punto del año
  const ytd26 = Object.entries(d26).filter(([k]) => k <= today).reduce((s, [, v]) => s + v, 0)
  const diasYtd26 = Object.keys(d26).filter(k => k <= today).length
  const ytd25 = Object.entries(d25).filter(([k]) => k <= todayEquiv25).reduce((s, [, v]) => s + v, 0)
  const diasYtd25 = Object.keys(d25).filter(k => k <= todayEquiv25).length

  const mediaYtd26 = diasYtd26 > 0 ? r2(ytd26 / diasYtd26) : 0
  const mediaYtd25 = diasYtd25 > 0 ? r2(ytd25 / diasYtd25) : 0
  const pctReal = mediaYtd25 > 0 ? (((mediaYtd26 - mediaYtd25) / mediaYtd25) * 100) : 0
  const posReal = pctReal >= 0
  const diffYTD = r2(ytd26 - ytd25)

  const maxChart = Math.max(...chart.map(m => Math.max(m.v25, m.v26)), 1)
  const mesNombre = new Date().toLocaleDateString('es-ES', { month: 'long' })
  const mesAnterior = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <div className="fade-in" style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '24px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '3px' }}>Panel de control</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>CHUORE Churros & More · {today}</p>
      </div>

      {/* Banner crecimiento real */}
      {!loading && (
        <div style={{ borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', border: `2px solid ${posReal ? 'var(--green-border)' : 'var(--c-red-border)'}`, background: posReal ? 'var(--green-bg)' : 'var(--c-red-bg)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{posReal ? '📈' : '📉'}</span>
          <div>
            <p style={{ fontWeight: '700', fontSize: '15px', color: posReal ? 'var(--green)' : 'var(--c-red)', marginBottom: '3px' }}>
              {posReal ? 'Por delante de 2025' : 'Por detrás de 2025'} — {sgn(pctReal)}{pctReal.toFixed(1)}% en media diaria
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              {euro(mediaYtd26)}/día en 2026 vs {euro(mediaYtd25)}/día en 2025 hasta el mismo punto del año.
              {' '}<strong style={{ color: posReal ? 'var(--green)' : 'var(--c-red)' }}>{sgn(r2(mediaYtd26 - mediaYtd25))}{euro(r2(mediaYtd26 - mediaYtd25))} por día abierto.</strong>
            </p>
          </div>
        </div>
      )}

      {/* KPIs principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          {
            label: `${mesNombre} 2025 (hasta d${diaActual})`,
            value: loading ? '—' : euro(ventasMes25),
            sub: `${diasMes25} días · ${euro(mediaMes25)}/día`,
            color: 'var(--text-3)', border: 'var(--border)'
          },
          {
            label: `${mesNombre} 2026`,
            value: loading ? '—' : euro(ventasMes26),
            sub: `${diasMes26} días · ${euro(mediaMes26)}/día`,
            color: 'var(--red)', border: 'var(--red)'
          },
          {
            label: 'Var. mes actual',
            value: loading ? '—' : `${sgn(pctMes)}${pctMes.toFixed(1)}%`,
            sub: `${sgn(r2(mediaMes26 - mediaMes25))}${euro(r2(mediaMes26 - mediaMes25))}/día vs 2025`,
            color: posMes ? 'var(--green)' : 'var(--c-red)',
            border: posMes ? 'var(--green-border)' : 'var(--c-red-border)'
          },
          {
            label: 'Crecimiento real YTD',
            value: loading ? '—' : `${sgn(pctReal)}${pctReal.toFixed(1)}%`,
            sub: `${sgn(diffYTD)}${euro(diffYTD)} vs 2025`,
            color: posReal ? 'var(--green)' : 'var(--c-red)',
            border: posReal ? 'var(--green-border)' : 'var(--c-red-border)'
          },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.border}` }}>
            <p className="stat-label">{k.label}</p>
            <p className="stat-value mono" style={{ color: k.color, fontSize: '18px' }}>{k.value}</p>
            <p className="stat-sub">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Segunda fila KPIs YTD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Facturado 2025 hasta hoy', value: loading ? '—' : euro(ytd25), sub: `${diasYtd25} días abiertos`, color: 'var(--text-3)', border: 'var(--border)' },
          { label: 'Facturado 2026 hasta hoy', value: loading ? '—' : euro(ytd26), sub: `${diasYtd26} días abiertos`, color: 'var(--red)', border: 'var(--red)' },
          { label: 'Diferencia YTD (€)', value: loading ? '—' : `${sgn(diffYTD)}${euro(diffYTD)}`, sub: posReal ? 'Por encima de 2025' : 'Por debajo de 2025', color: posReal ? 'var(--green)' : 'var(--c-red)', border: posReal ? 'var(--green-border)' : 'var(--c-red-border)' },
          { label: 'Media diaria 2026 vs 2025', value: loading ? '—' : `${euro(mediaYtd26)} vs ${euro(mediaYtd25)}`, sub: `${sgn(r2(mediaYtd26-mediaYtd25))}${euro(r2(mediaYtd26-mediaYtd25))} por día`, color: posReal ? 'var(--green)' : 'var(--c-red)', border: posReal ? 'var(--green-border)' : 'var(--c-red-border)' },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.border}` }}>
            <p className="stat-label">{k.label}</p>
            <p className="stat-value mono" style={{ color: k.color, fontSize: '16px' }}>{k.value}</p>
            <p className="stat-sub">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico + accesos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '14px', marginBottom: '14px' }}>
        <div className="card">
          <div className="card-header">
            <p className="card-title">Ventas mensuales — 2025 vs 2026 (comparación equitativa)</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-3)' }}><span style={{ width: '10px', height: '4px', background: 'var(--border-2)', display: 'inline-block', borderRadius: '2px' }} />2025</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-3)' }}><span style={{ width: '10px', height: '4px', background: 'var(--red)', display: 'inline-block', borderRadius: '2px' }} />2026</span>
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            {loading ? (
              <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>Cargando...</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', paddingBottom: '28px', position: 'relative' }}>
                  {[0, 25, 50, 75, 100].map(p => (
                    <div key={p} style={{ position: 'absolute', bottom: `calc(28px + ${p / 100 * 112}px)`, left: 0, right: 0, borderTop: '1px solid var(--surface-3)', zIndex: 0 }} />
                  ))}
                  {chart.map((m, i) => {
                    const diff = m.v25 > 0 ? ((m.v26 - m.v25) / m.v25) * 100 : 0
                    const isPos = diff >= 0
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', height: '112px' }}>
                          <div style={{ flex: 1, background: 'var(--border-2)', borderRadius: '3px 3px 0 0', height: `${(m.v25 / maxChart) * 100}%`, minHeight: m.v25 > 0 ? '3px' : '0' }} />
                          <div style={{ flex: 1, background: isPos ? 'var(--green)' : 'var(--c-red)', borderRadius: '3px 3px 0 0', height: `${(m.v26 / maxChart) * 100}%`, minHeight: m.v26 > 0 ? '3px' : '0', opacity: 0.8, transition: 'height 0.4s ease' }} />
                        </div>
                        <div style={{ position: 'absolute', bottom: '0', textAlign: 'center' }}>
                          <p style={{ fontSize: '10px', color: 'var(--text-4)', textTransform: 'capitalize' }}>{m.label}</p>
                          {m.v26 > 0 && m.v25 > 0 && (
                            <p style={{ fontSize: '9px', fontWeight: '700', color: isPos ? 'var(--green)' : 'var(--c-red)' }}>
                              {isPos ? '+' : ''}{diff.toFixed(0)}%
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--surface-3)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>Media 2025: <strong>{euro(mediaYtd25)}</strong>/día</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>Media 2026: <strong style={{ color: posReal ? 'var(--green)' : 'var(--c-red)' }}>{euro(mediaYtd26)}</strong>/día</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/dashboard/comparativa" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--black)', borderRadius: '10px', padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gold)', marginBottom: '3px' }}>Ver comparativa completa</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Detalle día a día · 2025 vs 2026</p>
              </div>
              <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </div>
          </Link>
          <Link href="/dashboard/ventas" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '2px' }}>Registrar venta de hoy</p>
                <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>Anotar el total del TPV</p>
              </div>
              <svg width="16" height="16" fill="none" stroke="var(--border-2)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </div>
          </Link>
          <Link href="/dashboard/gastos" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '2px' }}>Registrar gasto</p>
                <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>Materias primas, alquiler...</p>
              </div>
              <svg width="16" height="16" fill="none" stroke="var(--border-2)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </div>
          </Link>
          <Link href="/dashboard/pedidos" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '2px' }}>Hacer pedido</p>
                <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>Enviar por WhatsApp</p>
              </div>
              <svg width="16" height="16" fill="none" stroke="var(--border-2)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
