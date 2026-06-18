'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const r2 = (n: number) => Math.round(n * 100) / 100
const fe = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
const sgn = (n: number) => n >= 0 ? '+' : ''

const MONTHS = [
  { label: 'Enero', m25: '2025-01', m26: '2026-01', days: 31 },
  { label: 'Febrero', m25: '2025-02', m26: '2026-02', days: 28 },
  { label: 'Marzo', m25: '2025-03', m26: '2026-03', days: 31 },
  { label: 'Abril', m25: '2025-04', m26: '2026-04', days: 30 },
  { label: 'Mayo', m25: '2025-05', m26: '2026-05', days: 31 },
  { label: 'Junio', m25: '2025-06', m26: '2026-06', days: 30 },
  { label: 'Julio', m25: '2025-07', m26: '2026-07', days: 31 },
  { label: 'Agosto', m25: '2025-08', m26: '2026-08', days: 31 },
  { label: 'Septiembre', m25: '2025-09', m26: '2026-09', days: 30 },
  { label: 'Octubre', m25: '2025-10', m26: '2026-10', days: 31 },
  { label: 'Noviembre', m25: '2025-11', m26: '2026-11', days: 30 },
  { label: 'Diciembre', m25: '2025-12', m26: '2026-12', days: 31 },
]

type DayMap = Record<string, number>

function calcMes(prefix: string, data: DayMap, hastaDia?: number) {
  let entries = Object.entries(data).filter(([k]) => k.startsWith(prefix))
  if (hastaDia !== undefined) entries = entries.filter(([k]) => parseInt(k.slice(8)) <= hastaDia)
  const total = r2(entries.reduce((a, [, v]) => a + v, 0))
  const dias = entries.length
  return { total, dias, media: dias > 0 ? r2(total / dias) : 0 }
}

function lastDay(prefix: string, data: DayMap) {
  const keys = Object.keys(data).filter(k => k.startsWith(prefix))
  if (!keys.length) return null
  return Math.max(...keys.map(k => parseInt(k.slice(8))))
}

export default function ComparativaPage() {
  const [d25, setD25] = useState<DayMap>({})
  const [d26, setD26] = useState<DayMap>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [view, setView] = useState<'analisis' | 'diario'>('analisis')

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('ventas').select('fecha, total').order('fecha')
    if (!data) return
    const map25: DayMap = {}, map26: DayMap = {}
    data.forEach(({ fecha, total }) => {
      const f = String(fecha).slice(0, 10)
      if (f.startsWith('2025')) map25[f] = Number(total)
      if (f.startsWith('2026')) map26[f] = Number(total)
    })
    setD25(map25); setD26(map26); setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const today = new Date().toISOString().slice(0, 10)
  // Día equivalente en 2025 (mismo mes y día)
  const todayEquiv25 = `2025-${today.slice(5)}`

  const mesesConDatos = MONTHS.filter(m => calcMes(m.m25, d25).dias > 0 || calcMes(m.m26, d26).dias > 0)

  // YTD REAL: comparar hasta el mismo punto del año
  // Para 2025: todos los días hasta el equivalente de hoy
  // Para 2026: todos los días hasta hoy
  let ytd25Real = 0, ytd26Real = 0, diasYtd25 = 0, diasYtd26 = 0

  Object.entries(d25).forEach(([fecha, total]) => {
    if (fecha <= todayEquiv25) { ytd25Real = r2(ytd25Real + total); diasYtd25++ }
  })
  Object.entries(d26).forEach(([fecha, total]) => {
    if (fecha <= today) { ytd26Real = r2(ytd26Real + total); diasYtd26++ }
  })

  const mediaReal25 = diasYtd25 > 0 ? r2(ytd25Real / diasYtd25) : 0
  const mediaReal26 = diasYtd26 > 0 ? r2(ytd26Real / diasYtd26) : 0
  const pctMediaReal = mediaReal25 > 0 ? (((mediaReal26 - mediaReal25) / mediaReal25) * 100) : 0
  const posReal = pctMediaReal >= 0
  const diffYTD = r2(ytd26Real - ytd25Real)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '20px', height: '20px', border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
    </div>
  )

  return (
    <div className="fade-in" style={{ maxWidth: '960px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Comparativa 2025 vs 2026</h1>
          <p className="page-subtitle">Hasta el mismo punto del año · {today}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>↻ Actualizar</button>
      </div>

      {/* Banner principal */}
      <div style={{ borderRadius: '10px', padding: '18px 20px', marginBottom: '20px', border: `2px solid ${posReal ? 'var(--green-border)' : 'var(--c-red-border)'}`, background: posReal ? 'var(--green-bg)' : 'var(--c-red-bg)', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ fontSize: '40px', lineHeight: 1 }}>{posReal ? '📈' : '📉'}</div>
        <div>
          <p style={{ fontWeight: '700', fontSize: '18px', color: posReal ? 'var(--green)' : 'var(--c-red)', marginBottom: '4px' }}>
            {posReal ? 'Vas por delante de 2025' : 'Vas por detrás de 2025'} — {sgn(pctMediaReal)}{pctMediaReal.toFixed(1)}%
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
            Media diaria real 2026: <strong style={{ color: posReal ? 'var(--green)' : 'var(--c-red)' }}>{fe(mediaReal26)}/día</strong> vs <strong>{fe(mediaReal25)}/día</strong> en 2025 hasta el mismo punto.
            {' '}<strong style={{ color: posReal ? 'var(--green)' : 'var(--c-red)' }}>{sgn(r2(mediaReal26 - mediaReal25))}{fe(r2(mediaReal26 - mediaReal25))} por día abierto.</strong>
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Facturado 2025 hasta hoy', value: fe(ytd25Real), sub: `${diasYtd25} días abiertos`, color: 'var(--text-3)', border: 'var(--border)' },
          { label: 'Facturado 2026 hasta hoy', value: fe(ytd26Real), sub: `${diasYtd26} días abiertos`, color: 'var(--red)', border: 'var(--red)' },
          { label: 'Diferencia YTD', value: `${sgn(diffYTD)}${fe(diffYTD)}`, sub: posReal ? 'Por encima de 2025' : 'Por debajo de 2025', color: posReal ? 'var(--green)' : 'var(--c-red)', border: posReal ? 'var(--green-border)' : 'var(--c-red-border)' },
          { label: 'Crecimiento real', value: `${sgn(pctMediaReal)}${pctMediaReal.toFixed(1)}%`, sub: `${fe(mediaReal26)} vs ${fe(mediaReal25)}/día`, color: posReal ? 'var(--green)' : 'var(--c-red)', border: posReal ? 'var(--green-border)' : 'var(--c-red-border)' },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.border}` }}>
            <p className="stat-label">{k.label}</p>
            <p className="stat-value mono" style={{ color: k.color, fontSize: '17px' }}>{k.value}</p>
            <p className="stat-sub">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '20px', background: 'var(--surface-3)', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
        {(['analisis', 'diario'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding: '8px 20px', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: view === v ? 'var(--surface)' : 'transparent', border: 'none', color: view === v ? 'var(--text-1)' : 'var(--text-3)', borderRadius: '6px', transition: 'all 0.15s', boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            {v === 'analisis' ? 'Análisis' : 'Detalle diario'}
          </button>
        ))}
      </div>

      {/* ANÁLISIS */}
      {view === 'analisis' && (
        <div>
          {/* Tabla mensual */}
          <div className="table-wrap" style={{ marginBottom: '20px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th className="r">Días 25</th>
                  <th className="r">Días 26</th>
                  <th className="r">Media 25</th>
                  <th className="r">Media 26</th>
                  <th className="r">Total 25</th>
                  <th className="r">Total 26</th>
                  <th className="r">Var. media</th>
                </tr>
              </thead>
              <tbody>
                {mesesConDatos.map((m, i) => {
                  const ult = lastDay(m.m26, d26)
                  const s26full = calcMes(m.m26, d26)
                  const partial = s26full.dias < m.days && ult !== null
                  const lim = partial ? ult! : undefined
                  const ms25 = calcMes(m.m25, d25, lim)
                  const ms26 = calcMes(m.m26, d26)
                  const pct = ms25.media > 0 ? (((ms26.media - ms25.media) / ms25.media) * 100) : null
                  const isPos = pct !== null && pct >= 0
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: '600' }}>
                        {m.label}
                        {partial && ult ? <span style={{ fontSize: '10px', color: 'var(--text-4)', fontWeight: '400' }}> · hasta d{ult}</span> : ''}
                      </td>
                      <td className="r mono" style={{ color: 'var(--text-4)' }}>{ms25.dias}</td>
                      <td className="r mono" style={{ color: 'var(--text-2)' }}>{ms26.dias}</td>
                      <td className="r mono" style={{ color: 'var(--text-3)' }}>{ms25.media > 0 ? fe(ms25.media) : '—'}</td>
                      <td className="r mono" style={{ fontWeight: '600', color: 'var(--red)' }}>{ms26.media > 0 ? fe(ms26.media) : '—'}</td>
                      <td className="r mono" style={{ color: 'var(--text-3)' }}>{ms25.total > 0 ? fe(ms25.total) : '—'}</td>
                      <td className="r mono" style={{ fontWeight: '600' }}>{ms26.total > 0 ? fe(ms26.total) : '—'}</td>
                      <td className="r">
                        {pct !== null ? (
                          <span className="badge" style={{ background: isPos ? 'var(--green-bg)' : 'var(--c-red-bg)', color: isPos ? 'var(--green)' : 'var(--c-red)' }}>
                            {sgn(pct)}{pct.toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--surface-2)', borderTop: '2px solid var(--border)' }}>
                  <td style={{ fontWeight: '700', padding: '10px 14px' }}>YTD (mismos días)</td>
                  <td className="r mono" style={{ color: 'var(--text-4)', padding: '10px 14px', fontWeight: '700' }}>{diasYtd25}</td>
                  <td className="r mono" style={{ padding: '10px 14px', fontWeight: '700' }}>{diasYtd26}</td>
                  <td className="r mono" style={{ color: 'var(--text-3)', padding: '10px 14px', fontWeight: '700' }}>{fe(mediaReal25)}</td>
                  <td className="r mono" style={{ fontWeight: '700', padding: '10px 14px', color: 'var(--red)' }}>{fe(mediaReal26)}</td>
                  <td className="r mono" style={{ color: 'var(--text-3)', padding: '10px 14px', fontWeight: '700' }}>{fe(ytd25Real)}</td>
                  <td className="r mono" style={{ fontWeight: '700', padding: '10px 14px', color: 'var(--red)' }}>{fe(ytd26Real)}</td>
                  <td className="r" style={{ padding: '10px 14px' }}>
                    <span className="badge" style={{ background: posReal ? 'var(--green-bg)' : 'var(--c-red-bg)', color: posReal ? 'var(--green)' : 'var(--c-red)', fontSize: '12px' }}>
                      {sgn(pctMediaReal)}{pctMediaReal.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Barras visuales — verde si mejor, rojo si peor */}
          <div className="card" style={{ padding: '16px' }}>
            <p className="card-title" style={{ marginBottom: '14px' }}>Media por día abierto · comparación equitativa</p>
            {mesesConDatos.map((m, i) => {
              const ult = lastDay(m.m26, d26)
              const s26full = calcMes(m.m26, d26)
              const partial = s26full.dias < m.days && ult !== null
              const lim = partial ? ult! : undefined
              const ms25 = calcMes(m.m25, d25, lim)
              const ms26 = calcMes(m.m26, d26)
              const pct = ms25.media > 0 ? (((ms26.media - ms25.media) / ms25.media) * 100) : null
              const isPos = pct !== null && pct >= 0
              const maxM = Math.max(...mesesConDatos.map(mm => {
                const u2 = lastDay(mm.m26, d26)
                const s6f = calcMes(mm.m26, d26)
                const p2 = s6f.dias < mm.days && u2 !== null
                const l2 = p2 ? u2! : undefined
                return Math.max(calcMes(mm.m25, d25, l2).media, calcMes(mm.m26, d26).media)
              }), 1)

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-2)', width: '80px', flexShrink: 0 }}>{m.label}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '9px', color: 'var(--text-4)', width: '26px', fontFamily: 'monospace' }}>2025</span>
                      <div style={{ flex: 1, height: '14px', background: 'var(--surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min((ms25.media / maxM) * 100, 100)}%`, background: 'var(--border-2)', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)', width: '52px', textAlign: 'right', fontFamily: 'monospace' }}>{ms25.media > 0 ? `${Math.round(ms25.media)}€` : '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '9px', color: 'var(--text-4)', width: '26px', fontFamily: 'monospace' }}>2026</span>
                      <div style={{ flex: 1, height: '14px', background: 'var(--surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min((ms26.media / maxM) * 100, 100)}%`, background: isPos ? 'var(--green)' : 'var(--c-red)', borderRadius: '3px', opacity: 0.75, transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: isPos ? 'var(--green)' : 'var(--c-red)', width: '52px', textAlign: 'right', fontFamily: 'monospace' }}>{ms26.media > 0 ? `${Math.round(ms26.media)}€` : '—'}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', width: '52px', textAlign: 'right', flexShrink: 0, color: pct !== null ? (isPos ? 'var(--green)' : 'var(--c-red)') : 'var(--text-4)' }}>
                    {pct !== null ? `${sgn(pct)}${pct.toFixed(1)}%` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* DIARIO */}
      {view === 'diario' && (
        <div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '6px', marginBottom: '16px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {mesesConDatos.map((m, i) => (
              <button key={i} onClick={() => setTab(i)}
                style={{ flexShrink: 0, padding: '7px 14px', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: tab === i ? 'var(--red)' : 'var(--surface)', color: tab === i ? 'white' : 'var(--text-3)', border: `1px solid ${tab === i ? 'var(--red)' : 'var(--border)'}`, borderRadius: '20px', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                {m.label}
              </button>
            ))}
          </div>

          {mesesConDatos[tab] && (() => {
            const m = mesesConDatos[tab]
            const ult = lastDay(m.m26, d26)
            const s26full = calcMes(m.m26, d26)
            const partial = s26full.dias < m.days && ult !== null
            const lim = partial ? ult! : undefined
            const ms25 = calcMes(m.m25, d25, lim)
            const ms26 = calcMes(m.m26, d26)
            const diff = r2(ms26.total - ms25.total)
            const isPos = diff >= 0
            const pct = ms25.total > 0 ? (((ms26.total - ms25.total) / ms25.total) * 100) : null
            const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

            const rows = []
            for (let d = 1; d <= m.days; d++) {
              const dd = String(d).padStart(2, '0')
              const k25 = `${m.m25}-${dd}`, k26 = `${m.m26}-${dd}`
              const v25 = d25[k25] ?? null, v26 = d26[k26] ?? null
              if (v25 === null && v26 === null) continue
              const isToday = k26 === today
              let dv: number | null = null, pv: number | null = null
              if (v25 !== null && v26 !== null) { dv = r2(v26 - v25); pv = (dv / v25) * 100 }
              rows.push({ d, k25, k26, v25, v26, dow25: DOW[new Date(k25 + 'T12:00:00').getDay()], dow26: DOW[new Date(k26 + 'T12:00:00').getDay()], isToday, dv, pv })
            }

            return (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: `${m.label} 2025${partial && lim ? ` (hasta d${lim})` : ''}`, value: fe(ms25.total), sub: `${ms25.dias} días · ${fe(ms25.media)}/día`, color: 'var(--text-3)', border: 'var(--border)' },
                    { label: `${m.label} 2026`, value: fe(ms26.total), sub: `${ms26.dias} días · ${fe(ms26.media)}/día`, color: 'var(--red)', border: 'var(--red)' },
                    { label: 'Variación', value: pct !== null ? `${sgn(pct)}${pct.toFixed(1)}%` : '—', sub: `${sgn(diff)}${fe(diff)}`, color: isPos ? 'var(--green)' : 'var(--c-red)', border: isPos ? 'var(--green-border)' : 'var(--c-red-border)' },
                  ].map(k => (
                    <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.border}` }}>
                      <p className="stat-label">{k.label}</p>
                      <p className="stat-value mono" style={{ color: k.color, fontSize: '17px' }}>{k.value}</p>
                      <p className="stat-sub">{k.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Día 25</th><th className="r">Caja 25</th>
                        <th>Día 26</th><th className="r">Caja 26</th>
                        <th className="r">Dif.</th><th className="r">Var.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} style={{ background: row.isToday ? '#FFF8F0' : undefined }}>
                          <td style={{ color: 'var(--text-3)', fontSize: '12px' }}><span style={{ fontSize: '10px', marginRight: '5px', fontFamily: 'monospace', color: 'var(--text-4)' }}>{row.d}</span>{row.dow25}</td>
                          <td className="r mono" style={{ color: 'var(--text-3)' }}>{row.v25 !== null ? row.v25.toFixed(2) : '—'}</td>
                          <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>
                            <span style={{ fontSize: '10px', marginRight: '5px', fontFamily: 'monospace', color: 'var(--text-4)' }}>{row.d}</span>{row.dow26}
                            {row.isToday && <span style={{ marginLeft: '5px', fontSize: '9px', background: '#FFF0D0', color: 'var(--amber)', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>HOY</span>}
                          </td>
                          <td className="r mono" style={{ fontWeight: '600', color: row.dv !== null ? (row.dv >= 0 ? 'var(--green)' : 'var(--c-red)') : 'var(--text-1)' }}>{row.v26 !== null ? row.v26.toFixed(2) : '—'}</td>
                          <td className="r mono" style={{ color: row.dv !== null ? (row.dv >= 0 ? 'var(--green)' : 'var(--c-red)') : 'var(--text-4)', fontWeight: row.dv !== null ? '600' : '400' }}>
                            {row.dv !== null ? `${sgn(row.dv)}${row.dv.toFixed(2)}` : '—'}
                          </td>
                          <td className="r">
                            {row.pv !== null ? (
                              <span className="badge" style={{ background: row.pv >= 0 ? 'var(--green-bg)' : 'var(--c-red-bg)', color: row.pv >= 0 ? 'var(--green)' : 'var(--c-red)' }}>
                                {sgn(row.pv)}{row.pv.toFixed(1)}%
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--surface-2)', borderTop: '2px solid var(--border)' }}>
                        <td style={{ fontWeight: '700', padding: '10px 14px' }}>TOTAL</td>
                        <td className="r mono" style={{ color: 'var(--text-3)', padding: '10px 14px', fontWeight: '700' }}>{fe(ms25.total)}</td>
                        <td style={{ padding: '10px 14px' }}></td>
                        <td className="r mono" style={{ fontWeight: '700', padding: '10px 14px', color: 'var(--red)' }}>{fe(ms26.total)}</td>
                        <td className="r mono" style={{ fontWeight: '700', padding: '10px 14px', color: isPos ? 'var(--green)' : 'var(--c-red)' }}>{sgn(diff)}{fe(diff)}</td>
                        <td className="r" style={{ padding: '10px 14px' }}>
                          {pct !== null && <span className="badge" style={{ background: isPos ? 'var(--green-bg)' : 'var(--c-red-bg)', color: isPos ? 'var(--green)' : 'var(--c-red)' }}>{sgn(pct)}{pct.toFixed(1)}%</span>}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
