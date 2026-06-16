'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/* ── helpers ── */
const r2 = (n: number) => Math.round(n * 100) / 100
const fe = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
const f2 = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const sgn = (n: number) => n >= 0 ? '+' : ''
const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const MONTHS = [
  { label: 'Enero',      m25: '2025-01', m26: '2026-01', days: 31 },
  { label: 'Febrero',    m25: '2025-02', m26: '2026-02', days: 28 },
  { label: 'Marzo',      m25: '2025-03', m26: '2026-03', days: 31 },
  { label: 'Abril',      m25: '2025-04', m26: '2026-04', days: 30 },
  { label: 'Mayo',       m25: '2025-05', m26: '2026-05', days: 31 },
  { label: 'Junio',      m25: '2025-06', m26: '2026-06', days: 30 },
  { label: 'Julio',      m25: '2025-07', m26: '2026-07', days: 31 },
  { label: 'Agosto',     m25: '2025-08', m26: '2026-08', days: 31 },
  { label: 'Septiembre', m25: '2025-09', m26: '2026-09', days: 30 },
  { label: 'Octubre',    m25: '2025-10', m26: '2026-10', days: 31 },
  { label: 'Noviembre',  m25: '2025-11', m26: '2026-11', days: 30 },
  { label: 'Diciembre',  m25: '2025-12', m26: '2026-12', days: 31 },
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
    const { data, error } = await supabase
      .from('ventas')
      .select('fecha, total')
      .order('fecha')
    if (error || !data) return
    const map25: DayMap = {}
    const map26: DayMap = {}
    data.forEach(({ fecha, total }) => {
      const f = String(fecha).slice(0, 10)
      if (f.startsWith('2025')) map25[f] = Number(total)
      if (f.startsWith('2026')) map26[f] = Number(total)
    })
    setD25(map25)
    setD26(map26)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const today = new Date().toISOString().slice(0, 10)

  const mesesConDatos = MONTHS.filter(m => {
    const s25 = calcMes(m.m25, d25)
    const s26 = calcMes(m.m26, d26)
    return s25.dias > 0 || s26.dias > 0
  })

  // YTD
  let ytd25 = 0, ytd26 = 0, dias25 = 0, dias26 = 0
  mesesConDatos.forEach(m => {
    const ult = lastDay(m.m26, d26)
    const s26full = calcMes(m.m26, d26)
    const partial = s26full.dias < m.days && ult !== null
    const lim = partial ? ult! : undefined
    const s25 = calcMes(m.m25, d25, lim)
    const s26 = calcMes(m.m26, d26)
    ytd25 = r2(ytd25 + s25.total)
    ytd26 = r2(ytd26 + s26.total)
    dias25 += s25.dias
    dias26 += s26.dias
  })
  const mTot25 = dias25 > 0 ? r2(ytd25 / dias25) : 0
  const mTot26 = dias26 > 0 ? r2(ytd26 / dias26) : 0
  const pctYTD = mTot25 > 0 ? (((mTot26 - mTot25) / mTot25) * 100) : 0
  const posYTD = pctYTD >= 0

  /* ── Design tokens (dark dashboard style, consistent with CHUORE) ── */
  const dark = {
    bg: '#141009', bg2: '#1C140C', bg3: '#251A10', bg4: '#2E2014',
    border: '#352818', border2: '#3D2F1A',
    text: '#F2EAE0', text2: '#B09880', text3: '#6B5540',
    green: '#3DBA7A', gBg: '#071A10', gBorder: '#1A5A3A',
    red: '#E05545', rBg: '#1E0808', rBorder: '#6A1A1A',
    gold: '#C8963E',
  }

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark.bg, borderRadius: '10px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '20px', height: '20px', border: `2px solid ${dark.gold}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} className="spin" />
        <p style={{ fontFamily: 'monospace', fontSize: '11px', color: dark.text3, letterSpacing: '1px', textTransform: 'uppercase' }}>Cargando datos</p>
      </div>
    </div>
  )

  return (
    <div style={{ background: dark.bg, borderRadius: '10px', minHeight: 'calc(100vh - 56px)', padding: '24px 20px 48px', color: dark.text, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: `1px solid ${dark.border2}` }}>
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>CHUORE · Análisis de caja</p>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '26px', fontWeight: '600', color: dark.text, letterSpacing: '-0.3px', lineHeight: 1 }}>
            2025 <span style={{ color: dark.text3 }}>vs</span> 2026
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.gold, background: 'rgba(200,150,62,0.1)', border: `1px solid rgba(200,150,62,0.25)`, padding: '3px 8px', borderRadius: '3px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            ● En curso
          </span>
          <button onClick={loadData} style={{ background: dark.bg3, border: `1px solid ${dark.border}`, borderRadius: '6px', padding: '5px 10px', color: dark.text3, fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '24px', background: dark.bg3, borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
        {(['analisis', 'diario'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding: '8px 20px', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: view === v ? dark.bg4 : 'transparent', border: 'none', color: view === v ? dark.text : dark.text3, borderRadius: '6px', letterSpacing: '0.02em', transition: 'all 0.15s', boxShadow: view === v ? `0 1px 4px rgba(0,0,0,0.4)` : 'none' }}>
            {v === 'analisis' ? 'Análisis' : 'Detalle diario'}
          </button>
        ))}
      </div>

      {/* ══ ANÁLISIS ══ */}
      {view === 'analisis' && (
        <div>
          {/* Trend banner */}
          <div style={{ borderRadius: '8px', padding: '16px 18px', marginBottom: '20px', border: `1px solid ${posYTD ? dark.gBorder : dark.rBorder}`, background: posYTD ? dark.gBg : dark.rBg, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '24px', flexShrink: 0, lineHeight: 1, marginTop: '2px' }}>{posYTD ? '↑' : '↓'}</div>
            <div>
              <p style={{ fontWeight: '700', fontSize: '15px', color: posYTD ? dark.green : dark.red, marginBottom: '6px', letterSpacing: '-0.2px' }}>
                {posYTD ? 'Crecimiento' : 'Caída'} {sgn(pctYTD)}{pctYTD.toFixed(1)}% en media diaria
              </p>
              <p style={{ fontSize: '12px', color: dark.text2, lineHeight: 1.7 }}>
                Media por día abierto 2026: <strong style={{ color: dark.text }}>{fe(mTot26)}</strong> vs <strong style={{ color: dark.text2 }}>{fe(mTot25)}</strong> en 2025.{' '}
                <strong style={{ color: dark.text }}>{sgn(r2(mTot26 - mTot25))}{fe(r2(mTot26 - mTot25))} por día abierto.</strong>
              </p>
            </div>
          </div>

          {/* KPIs análisis */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '24px' }}>
            {[
              { label: 'Media diaria 2025', val: fe(mTot25), sub: `${dias25} días`, dim: true },
              { label: 'Media diaria 2026', val: fe(mTot26), sub: `${dias26} días`, dim: false },
              { label: 'Crecimiento real', val: `${sgn(pctYTD)}${pctYTD.toFixed(1)}%`, sub: `${sgn(r2(mTot26 - mTot25))}${fe(r2(mTot26 - mTot25))}/día`, green: posYTD, red: !posYTD },
              { label: 'YTD 2026', val: fe(ytd26), sub: `vs 2025: ${sgn(r2(ytd26 - ytd25))}${fe(r2(ytd26 - ytd25))}`, dim: false },
            ].map((k, i) => (
              <div key={i} style={{ background: dark.bg2, border: `1px solid ${dark.border}`, borderRadius: '8px', padding: '14px' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>{k.label}</p>
                <p style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', lineHeight: 1, color: k.green ? dark.green : k.red ? dark.red : k.dim ? dark.text2 : dark.text }}>{k.val}</p>
                <p style={{ fontFamily: 'monospace', fontSize: '10px', color: k.green ? dark.green : dark.text3, marginTop: '6px' }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Tabla comparativa */}
          <p style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Comparativa mensual · Media por día abierto</p>
          <div style={{ border: `1px solid ${dark.border}`, borderRadius: '8px', overflow: 'hidden', overflowX: 'auto', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
              <thead>
                <tr style={{ background: dark.bg3 }}>
                  {['Mes', 'Días 25', 'Días 26', 'Total 25', 'Total 26', 'Media 25', 'Media 26', '% real'].map((h, i) => (
                    <th key={h} style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.6px', color: dark.text3, padding: '10px 12px', textAlign: i === 0 ? 'left' : 'right', borderBottom: `1px solid ${dark.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
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
                    <tr key={i} style={{ borderBottom: `1px solid ${dark.border}` }}>
                      <td style={{ padding: '9px 12px', fontSize: '13px', fontWeight: '600', color: dark.text, textAlign: 'left', whiteSpace: 'nowrap' }}>
                        {m.label}{partial && ult ? <span style={{ fontSize: '10px', color: dark.text3, fontWeight: '400' }}> · hasta día {ult}</span> : ''}
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text3, textAlign: 'right' }}>{ms25.dias}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text2, textAlign: 'right' }}>{ms26.dias}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text3, textAlign: 'right' }}>{ms25.total > 0 ? fe(ms25.total).replace(' €','') : '—'}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text, fontWeight: '600', textAlign: 'right' }}>{ms26.total > 0 ? fe(ms26.total).replace(' €','') : '—'}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text3, textAlign: 'right' }}>{ms25.media > 0 ? fe(ms25.media).replace(' €','') : '—'}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text, fontWeight: '600', textAlign: 'right' }}>{ms26.media > 0 ? fe(ms26.media).replace(' €','') : '—'}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', textAlign: 'right', color: pct !== null ? (isPos ? dark.green : dark.red) : dark.text3 }}>
                        {pct !== null ? `${sgn(pct)}${pct.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ background: dark.bg3, borderTop: `1px solid ${dark.border2}` }}>
                  <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: dark.text, textAlign: 'left' }}>TOTAL YTD</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text3, textAlign: 'right', fontWeight: '700' }}>{dias25}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text2, textAlign: 'right', fontWeight: '700' }}>{dias26}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text3, textAlign: 'right', fontWeight: '700' }}>{fe(ytd25).replace(' €','')}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text, textAlign: 'right', fontWeight: '700' }}>{fe(ytd26).replace(' €','')}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text3, textAlign: 'right', fontWeight: '700' }}>{fe(mTot25).replace(' €','')}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: dark.text, textAlign: 'right', fontWeight: '700' }}>{fe(mTot26).replace(' €','')}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', fontWeight: '800', textAlign: 'right', color: posYTD ? dark.green : dark.red }}>
                    {sgn(pctYTD)}{pctYTD.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Visual bars */}
          <p style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>Media por día abierto — visual</p>
          <div>
            {mesesConDatos.map((m, i) => {
              const ult = lastDay(m.m26, d26)
              const s26full = calcMes(m.m26, d26)
              const partial = s26full.dias < m.days && ult !== null
              const lim = partial ? ult! : undefined
              const ms25 = calcMes(m.m25, d25, lim)
              const ms26 = calcMes(m.m26, d26)
              const pct = ms25.media > 0 ? (((ms26.media - ms25.media) / ms25.media) * 100) : null
              const isPos = pct !== null && pct >= 0
              const maxM = 1400
              const w25 = Math.round((ms25.media / maxM) * 100)
              const w26 = Math.round((ms26.media / maxM) * 100)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: dark.text2, width: '76px', flexShrink: 0 }}>{m.label}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, width: '26px' }}>2025</span>
                      <div style={{ flex: 1, height: '14px', background: dark.bg4, borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${w25}%`, background: dark.bg4, borderLeft: `2px solid ${dark.text3}`, display: 'flex', alignItems: 'center', paddingLeft: '5px' }}>
                          {ms25.media > 0 && <span style={{ fontFamily: 'monospace', fontSize: '8px', color: dark.text3, whiteSpace: 'nowrap' }}>{Math.round(ms25.media)}€</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, width: '26px' }}>2026</span>
                      <div style={{ flex: 1, height: '14px', background: dark.bg4, borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${w26}%`, background: isPos ? 'rgba(61,186,122,0.25)' : 'rgba(224,85,69,0.25)', borderLeft: `2px solid ${isPos ? dark.green : dark.red}`, display: 'flex', alignItems: 'center', paddingLeft: '5px', transition: 'width 0.5s ease' }}>
                          {ms26.media > 0 && <span style={{ fontFamily: 'monospace', fontSize: '8px', color: isPos ? dark.green : dark.red, whiteSpace: 'nowrap' }}>{Math.round(ms26.media)}€</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: '700', width: '52px', textAlign: 'right', flexShrink: 0, color: pct !== null ? (isPos ? dark.green : dark.red) : dark.text3 }}>
                    {pct !== null ? `${sgn(pct)}${pct.toFixed(1)}%` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ DIARIO ══ */}
      {view === 'diario' && (
        <div>
          {/* YTD KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            {[
              { label: 'Total 2025 YTD', val: fe(ytd25), color: dark.text2 },
              { label: 'Total 2026 YTD', val: fe(ytd26), color: dark.text },
              { label: 'Variación YTD', val: `${sgn(pctYTD)}${pctYTD.toFixed(1)}%`, color: posYTD ? dark.green : dark.red },
            ].map((k, i) => (
              <div key={i} style={{ background: dark.bg2, border: `1px solid ${dark.border}`, borderRadius: '8px', padding: '14px' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>{k.label}</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: k.color, letterSpacing: '-0.5px' }}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Mes tabs */}
          <div style={{ display: 'flex', overflowX: 'auto', gap: '6px', marginBottom: '16px', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {mesesConDatos.map((m, i) => {
              const s26 = calcMes(m.m26, d26)
              const partial = s26.dias < m.days && lastDay(m.m26, d26) !== null
              return (
                <button key={i} onClick={() => setTab(i)}
                  style={{ flexShrink: 0, padding: '7px 16px', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: tab === i ? dark.red : dark.bg2, color: tab === i ? 'white' : dark.text3, border: `1px solid ${tab === i ? dark.red : dark.border}`, borderRadius: '20px', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {m.label}{partial ? <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: dark.gold, marginLeft: '5px', verticalAlign: 'middle' }} /> : ''}
                </button>
              )
            })}
          </div>

          {/* Mes activo */}
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
            const maxV = Math.max(ms25.total, ms26.total, 1)

            const rows = []
            for (let d = 1; d <= m.days; d++) {
              const dd = String(d).padStart(2, '0')
              const k25 = `${m.m25}-${dd}`
              const k26 = `${m.m26}-${dd}`
              const v25 = d25[k25] ?? null
              const v26 = d26[k26] ?? null
              if (v25 === null && v26 === null) continue
              const isToday = k26 === today
              let dv: number | null = null, pv: number | null = null
              if (v25 !== null && v26 !== null) { dv = r2(v26 - v25); pv = (dv / v25) * 100 }
              rows.push({ d, dd, k25, k26, v25, v26, dow25: DOW[new Date(k25 + 'T12:00:00').getDay()], dow26: DOW[new Date(k26 + 'T12:00:00').getDay()], isToday, dv, pv })
            }

            return (
              <div>
                {/* Resumen mes */}
                <div style={{ background: dark.bg2, border: `1px solid ${dark.border}`, borderRadius: '8px', padding: '16px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    {[
                      { year: '2025', label: ms25.dias + ' días · ' + fe(ms25.media) + '/día', val: fe(ms25.total), dim: true },
                      { year: '2026', label: ms26.dias + ' días · ' + fe(ms26.media) + '/día' + (partial && ult ? ` · hasta día ${ult}` : ''), val: fe(ms26.total), dim: false },
                    ].map(k => (
                      <div key={k.year}>
                        <p style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '5px' }}>{k.year} · {m.label}</p>
                        <p style={{ fontSize: '22px', fontWeight: '800', color: k.dim ? dark.text2 : dark.text, letterSpacing: '-0.5px' }}>{k.val}</p>
                        <p style={{ fontFamily: 'monospace', fontSize: '10px', color: dark.text3, marginTop: '3px' }}>{k.label}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {[{ year: '2025', val: ms25.total }, { year: '2026', val: ms26.total }].map(b => (
                        <div key={b.year} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, width: '26px' }}>{b.year}</span>
                          <div style={{ flex: 1, height: '8px', background: dark.bg4, borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round((b.val / maxV) * 100)}%`, background: dark.text3, borderRadius: '2px' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '10px 14px', textAlign: 'center', minWidth: '88px', borderRadius: '6px', border: `1px solid ${isPos ? dark.gBorder : dark.rBorder}`, background: isPos ? dark.gBg : dark.rBg }}>
                      <p style={{ fontSize: '18px', fontWeight: '800', color: isPos ? dark.green : dark.red, lineHeight: 1 }}>{pct !== null ? `${sgn(pct)}${pct.toFixed(1)}%` : '—'}</p>
                      <p style={{ fontFamily: 'monospace', fontSize: '10px', color: isPos ? dark.green : dark.red, marginTop: '3px' }}>{sgn(diff)}{fe(diff)}</p>
                    </div>
                  </div>
                </div>

                {/* Tabla diaria */}
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Detalle diario</div>
                <div style={{ border: `1px solid ${dark.border}`, borderRadius: '8px', overflow: 'hidden', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                    <thead>
                      <tr style={{ background: dark.bg3 }}>
                        {['Día 25', 'Caja 25', 'Día 26', 'Caja 26', 'Dif.', 'Var.'].map((h, i) => (
                          <th key={h} style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.6px', color: dark.text3, padding: '9px 10px', textAlign: i < 2 ? 'left' : 'right', borderBottom: `1px solid ${dark.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} style={{ background: row.isToday ? `rgba(200,150,62,0.06)` : 'transparent', borderBottom: `1px solid ${dark.border}` }}>
                          <td style={{ padding: '7px 10px', fontSize: '12px', color: dark.text2 }}><span style={{ color: dark.text3, fontSize: '10px', marginRight: '5px', fontFamily: 'monospace' }}>{row.d}</span>{row.dow25}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '12px', color: dark.text3, textAlign: 'right' }}>{row.v25 !== null ? f2(row.v25) : <span style={{ fontStyle: 'italic', fontSize: '10px' }}>—</span>}</td>
                          <td style={{ padding: '7px 10px', fontSize: '12px', color: dark.text2 }}><span style={{ color: dark.text3, fontSize: '10px', marginRight: '5px', fontFamily: 'monospace' }}>{row.d}</span>{row.dow26}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '12px', color: dark.text, fontWeight: '600', textAlign: 'right' }}>{row.v26 !== null ? f2(row.v26) : <span style={{ color: dark.text3, fontStyle: 'italic', fontSize: '10px' }}>—</span>}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '12px', textAlign: 'right', color: row.dv !== null ? (row.dv >= 0 ? dark.green : dark.red) : dark.text3, fontWeight: row.dv !== null ? '600' : '400' }}>
                            {row.dv !== null ? `${sgn(row.dv)}${f2(row.dv)}` : '—'}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                            {row.pv !== null ? (
                              <span style={{ display: 'inline-flex', fontFamily: 'monospace', fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '3px', background: row.pv >= 0 ? dark.gBg : dark.rBg, color: row.pv >= 0 ? dark.green : dark.red, border: `1px solid ${row.pv >= 0 ? dark.gBorder : dark.rBorder}` }}>
                                {sgn(row.pv)}{row.pv.toFixed(1)}%
                              </span>
                            ) : <span style={{ color: dark.text3, fontStyle: 'italic', fontSize: '10px', fontFamily: 'monospace' }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: dark.bg3, borderTop: `1px solid ${dark.border2}` }}>
                        <td style={{ padding: '9px 10px', fontWeight: '700', fontSize: '12px', color: dark.text }}>TOTAL</td>
                        <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '12px', color: dark.text3, textAlign: 'right', fontWeight: '700' }}>{fe(ms25.total)}</td>
                        <td></td>
                        <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '12px', color: dark.text, textAlign: 'right', fontWeight: '700' }}>{fe(ms26.total)}</td>
                        <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '12px', textAlign: 'right', fontWeight: '700', color: isPos ? dark.green : dark.red }}>{sgn(diff)}{fe(diff)}</td>
                        <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '12px', textAlign: 'right', fontWeight: '700', color: isPos ? dark.green : dark.red }}>{pct !== null ? `${sgn(pct)}${pct.toFixed(1)}%` : '—'}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: dark.text3, textAlign: 'center', marginTop: '32px', paddingTop: '16px', borderTop: `1px solid ${dark.border}`, letterSpacing: '0.5px' }}>
        Datos en tiempo real · Supabase · CHUORE Churros & More
      </div>
    </div>
  )
}
