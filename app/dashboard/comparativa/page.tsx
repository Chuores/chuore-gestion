'use client'
import { useEffect, useState } from 'react'
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

interface DayData { [fecha: string]: number }
interface MonthStats { total: number; dias: number; media: number }

function calcMes(prefix: string, data: DayData, hastaDia?: number): MonthStats {
  let entries = Object.entries(data).filter(([k]) => k.startsWith(prefix))
  if (hastaDia !== undefined) entries = entries.filter(([k]) => parseInt(k.slice(-2)) <= hastaDia)
  const total = r2(entries.reduce((a, [, v]) => a + v, 0))
  const dias = entries.length
  const media = dias > 0 ? r2(total / dias) : 0
  return { total, dias, media }
}

function ultimoDia(prefix: string, data: DayData): number | null {
  const keys = Object.keys(data).filter(k => k.startsWith(prefix))
  if (!keys.length) return null
  return Math.max(...keys.map(k => parseInt(k.slice(-2))))
}

export default function ComparativaPage() {
  const [d25, setD25] = useState<DayData>({})
  const [d26, setD26] = useState<DayData>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [view, setView] = useState<'analisis' | 'diario'>('analisis')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('ventas').select('fecha, total').order('fecha')
      if (!data) return
      const map25: DayData = {}
      const map26: DayData = {}
      data.forEach(({ fecha, total }) => {
        const day = fecha.slice(5) // MM-DD
        if (fecha.startsWith('2025')) map25['2025-' + day] = total
        if (fecha.startsWith('2026')) map26['2026-' + day] = total
      })
      setD25(map25)
      setD26(map26)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  // Calcular meses con datos
  const mesesConDatos = MONTHS.filter(m => {
    const s25 = calcMes(m.m25, d25)
    const s26 = calcMes(m.m26, d26)
    return s25.dias > 0 || s26.dias > 0
  })

  // YTD totales
  let ytd25 = 0, ytd26 = 0, dias25 = 0, dias26 = 0
  mesesConDatos.forEach(m => {
    const ult = ultimoDia(m.m26, d26)
    const partial = ult !== null && calcMes(m.m26, d26).dias < m.days
    const lim = partial ? ult : undefined
    const s25 = calcMes(m.m25, d25, lim)
    const s26 = calcMes(m.m26, d26)
    ytd25 = r2(ytd25 + s25.total)
    ytd26 = r2(ytd26 + s26.total)
    dias25 += s25.dias
    dias26 += s26.dias
  })
  const mTot25 = dias25 > 0 ? r2(ytd25 / dias25) : 0
  const mTot26 = dias26 > 0 ? r2(ytd26 / dias26) : 0
  const pctTotal = mTot25 > 0 ? (((mTot26 - mTot25) / mTot25) * 100) : 0
  const posTotal = pctTotal >= 0

  const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const s = {
    bg: '#0A0A0A', bg2: '#111111', bg3: '#1A1A1A', bg4: '#222222',
    border: '#2A2A2A', border2: '#333333',
    text: '#F0F0F0', text2: '#A0A0A0', text3: '#555555',
    red: '#E84040', redDim: '#7A1A1A', redBg: '#1E0808',
    green: '#2ECC71', grnDim: '#1A6B3A', grnBg: '#071A10',
    gold: '#F0B429',
  }

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: s.bg, borderRadius: '10px' }}>
      <p style={{ color: s.text3, fontFamily: 'monospace', fontSize: '12px' }}>Cargando datos...</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: s.bg, borderRadius: '10px', minHeight: 'calc(100vh - 56px)', padding: '20px 16px 40px', color: s.text, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ paddingBottom: '16px', marginBottom: '20px', borderBottom: `1px solid ${s.border2}` }}>
        <h1 style={{ fontFamily: 'system-ui', fontSize: '28px', fontWeight: '900', color: s.red, letterSpacing: '-1px', lineHeight: 1, textTransform: 'uppercase' }}>CHUORE<br />Dashboard</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: s.text3, letterSpacing: '0.5px', textTransform: 'uppercase' }}>2025 vs 2026 · Caja</p>
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: s.gold, background: '#1A1200', border: `1px solid #3A2A00`, padding: '2px 7px', borderRadius: '2px', letterSpacing: '1px', textTransform: 'uppercase' }}>● En curso</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', marginBottom: '20px', background: s.bg3, borderRadius: '6px', padding: '3px', gap: '3px' }}>
        {(['analisis', 'diario'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{ flex: 1, padding: '9px 8px', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: view === v ? s.bg4 : 'none', border: 'none', color: view === v ? s.text : s.text3, borderRadius: '4px', boxShadow: view === v ? '0 1px 4px rgba(0,0,0,.4)' : 'none' }}>
            {v === 'analisis' ? 'Análisis' : 'Diario'}
          </button>
        ))}
      </div>

      {/* ANÁLISIS VIEW */}
      {view === 'analisis' && (
        <div>
          {/* Trend banner */}
          <div style={{ borderRadius: '8px', padding: '16px 14px', marginBottom: '16px', border: `1px solid ${posTotal ? s.grnDim : s.redDim}`, background: posTotal ? s.grnBg : s.redBg, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '28px', flexShrink: 0, lineHeight: 1, marginTop: '2px' }}>{posTotal ? '📈' : '📉'}</div>
            <div>
              <div style={{ fontFamily: 'system-ui', fontSize: '16px', fontWeight: '900', lineHeight: 1.2, marginBottom: '6px', color: posTotal ? s.green : s.red }}>
                {posTotal ? 'CRECIENDO' : 'BAJANDO'} {sgn(pctTotal)}{pctTotal.toFixed(1)}%
              </div>
              <div style={{ fontSize: '12px', color: s.text2, lineHeight: 1.7 }}>
                Media diaria 2026: <strong style={{ color: s.text }}>{fe(mTot26)}</strong> vs <strong style={{ color: s.text2 }}>{fe(mTot25)}</strong> en 2025.<br />
                <strong style={{ color: s.text }}>{sgn(mTot26 - mTot25)}{fe(r2(mTot26 - mTot25))} por día abierto.</strong>
              </div>
            </div>
          </div>

          {/* KPIs análisis */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {[
              { label: 'Media diaria 2025', value: fe(mTot25), sub: `${dias25} días`, dim: true },
              { label: 'Media diaria 2026', value: fe(mTot26), sub: `${dias26} días`, dim: false },
              { label: 'Crecimiento real', value: `${sgn(pctTotal)}${pctTotal.toFixed(1)}%`, sub: `${sgn(r2(mTot26 - mTot25))}${fe(r2(mTot26 - mTot25))}/día`, green: posTotal },
              { label: 'YTD 2026 total', value: fe(ytd26), sub: `vs 2025: ${sgn(r2(ytd26 - ytd25))}${fe(r2(ytd26 - ytd25))}`, dim: false },
            ].map((k, i) => (
              <div key={i} style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: '5px' }}>{k.label}</div>
                <div style={{ fontFamily: 'system-ui', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1, color: k.green ? s.green : k.dim ? s.text2 : s.text }}>{k.value}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: k.green ? s.green : s.text3, marginTop: '4px' }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabla comparativa */}
          <p style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px', marginTop: '20px' }}>Comparativa mensual por días abiertos</p>
          <div style={{ border: `1px solid ${s.border}`, borderRadius: '8px', overflow: 'hidden', overflowX: 'auto', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead>
                <tr style={{ background: s.bg3 }}>
                  {['Mes', 'Días 25', 'Días 26', 'Total 25', 'Total 26', 'Media 25', 'Media 26', '% real'].map(h => (
                    <th key={h} style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.6px', color: s.text3, padding: '9px 12px', textAlign: h === 'Mes' ? 'left' : 'right', borderBottom: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mesesConDatos.map((m, i) => {
                  const ult = ultimoDia(m.m26, d26)
                  const s26data = calcMes(m.m26, d26)
                  const partial = s26data.dias < m.days && ult !== null
                  const lim = partial ? ult! : undefined
                  const ms25 = calcMes(m.m25, d25, lim)
                  const ms26 = calcMes(m.m26, d26)
                  const pct = ms25.media > 0 ? (((ms26.media - ms25.media) / ms25.media) * 100) : null
                  const isPos = pct !== null && pct >= 0
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${s.border}` }}>
                      <td style={{ fontFamily: 'system-ui', padding: '9px 12px', fontSize: '13px', color: s.text, fontWeight: '600', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        {m.label}{partial && ult ? <span style={{ fontSize: '10px', color: s.text3 }}> (hasta día {ult})</span> : ''}
                      </td>
                      <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text3, textAlign: 'right' }}>{ms25.dias}</td>
                      <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text2, textAlign: 'right' }}>{ms26.dias}</td>
                      <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text3, textAlign: 'right' }}>{fe(ms25.total).replace(' €', '')}</td>
                      <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text, textAlign: 'right' }}>{fe(ms26.total).replace(' €', '')}</td>
                      <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text3, textAlign: 'right' }}>{fe(ms25.media).replace(' €', '')}</td>
                      <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text, textAlign: 'right' }}>{fe(ms26.media).replace(' €', '')}</td>
                      <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', fontWeight: '600', textAlign: 'right', color: pct !== null ? (isPos ? s.green : s.red) : s.text3 }}>
                        {pct !== null ? `${sgn(pct)}${pct.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ background: s.bg3, borderTop: `1px solid ${s.border2}` }}>
                  <td style={{ fontFamily: 'system-ui', padding: '9px 12px', fontSize: '13px', color: s.text, fontWeight: '700', textAlign: 'left' }}>TOTAL YTD</td>
                  <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text3, textAlign: 'right', fontWeight: '700' }}>{dias25}</td>
                  <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text2, textAlign: 'right', fontWeight: '700' }}>{dias26}</td>
                  <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text3, textAlign: 'right', fontWeight: '700' }}>{fe(ytd25).replace(' €', '')}</td>
                  <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text, textAlign: 'right', fontWeight: '700' }}>{fe(ytd26).replace(' €', '')}</td>
                  <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text3, textAlign: 'right', fontWeight: '700' }}>{fe(mTot25).replace(' €', '')}</td>
                  <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', color: s.text, textAlign: 'right', fontWeight: '700' }}>{fe(mTot26).replace(' €', '')}</td>
                  <td style={{ fontFamily: 'monospace', padding: '9px 12px', fontSize: '12px', fontWeight: '700', textAlign: 'right', color: posTotal ? s.green : s.red }}>
                    {sgn(pctTotal)}{pctTotal.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Gráfico barras */}
          <p style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Media por día abierto — visual</p>
          <div>
            {mesesConDatos.map((m, i) => {
              const ult = ultimoDia(m.m26, d26)
              const s26data = calcMes(m.m26, d26)
              const partial = s26data.dias < m.days && ult !== null
              const lim = partial ? ult! : undefined
              const ms25 = calcMes(m.m25, d25, lim)
              const ms26 = calcMes(m.m26, d26)
              const pct = ms25.media > 0 ? (((ms26.media - ms25.media) / ms25.media) * 100) : null
              const isPos = pct !== null && pct >= 0
              const maxMedia = 1400
              const w25 = Math.round((ms25.media / maxMedia) * 100)
              const w26 = Math.round((ms26.media / maxMedia) * 100)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'system-ui', fontSize: '11px', fontWeight: '600', color: s.text2, width: '70px', flexShrink: 0 }}>{m.label}</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, width: '24px', flexShrink: 0 }}>2025</span>
                      <div style={{ flex: 1, height: '16px', background: s.bg3, borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${w25}%`, background: s.bg4, borderRadius: '2px', display: 'flex', alignItems: 'center', paddingLeft: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, whiteSpace: 'nowrap' }}>{Math.round(ms25.media)}€</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, width: '24px', flexShrink: 0 }}>2026</span>
                      <div style={{ flex: 1, height: '16px', background: s.bg3, borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${w26}%`, background: isPos ? s.grnDim : s.redDim, borderRadius: '2px', display: 'flex', alignItems: 'center', paddingLeft: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{Math.round(ms26.media)}€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: '500', width: '52px', textAlign: 'right', flexShrink: 0, color: pct !== null ? (isPos ? s.green : s.red) : s.text3 }}>
                    {pct !== null ? `${sgn(pct)}${pct.toFixed(1)}%` : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* DIARIO VIEW */}
      {view === 'diario' && (
        <div>
          {/* KPIs YTD */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '14px 12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px' }}>Total 2025</div>
              <div style={{ fontFamily: 'system-ui', fontSize: '22px', fontWeight: '800', color: s.text2, letterSpacing: '-0.5px' }}>{fe(ytd25)}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: s.text3, marginTop: '4px' }}>YTD acumulado</div>
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '14px 12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px' }}>Total 2026</div>
              <div style={{ fontFamily: 'system-ui', fontSize: '22px', fontWeight: '800', color: s.text, letterSpacing: '-0.5px' }}>{fe(ytd26)}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: s.text3, marginTop: '4px' }}>YTD acumulado</div>
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '14px 12px', gridColumn: '1 / -1' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px' }}>Variación YTD</div>
              <div style={{ fontFamily: 'system-ui', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: posTotal ? s.green : s.red }}>
                {sgn(pctTotal)}{pctTotal.toFixed(1)}%
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: s.text3, marginTop: '4px' }}>
                {sgn(r2(ytd26 - ytd25))}{fe(r2(ytd26 - ytd25))}
              </div>
            </div>
          </div>

          {/* Tabs meses */}
          <div style={{ display: 'flex', overflowX: 'auto', gap: '6px', marginBottom: '16px', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {mesesConDatos.map((m, i) => {
              const ult = ultimoDia(m.m26, d26)
              const s26data = calcMes(m.m26, d26)
              const partial = s26data.dias < m.days && ult !== null
              return (
                <button key={i} onClick={() => setActiveTab(i)}
                  style={{ flexShrink: 0, padding: '7px 16px', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', color: activeTab === i ? 'white' : s.text3, cursor: 'pointer', background: activeTab === i ? s.red : s.bg2, border: `1px solid ${activeTab === i ? s.red : s.border}`, borderRadius: '20px', whiteSpace: 'nowrap' }}>
                  {m.label}{partial ? ' •' : ''}
                </button>
              )
            })}
          </div>

          {/* Panel mes activo */}
          {mesesConDatos[activeTab] && (() => {
            const m = mesesConDatos[activeTab]
            const ult = ultimoDia(m.m26, d26)
            const s26data = calcMes(m.m26, d26)
            const partial = s26data.dias < m.days && ult !== null
            const lim = partial ? ult! : undefined
            const ms25 = calcMes(m.m25, d25, lim)
            const ms26 = calcMes(m.m26, d26)
            const diff = r2(ms26.total - ms25.total)
            const isPos = diff >= 0
            const pct = ms25.total > 0 ? (((ms26.total - ms25.total) / ms25.total) * 100) : null
            const maxV = Math.max(ms25.total, ms26.total, 1)
            const w25 = Math.round((ms25.total / maxV) * 100)
            const w26 = Math.round((ms26.total / maxV) * 100)

            // Filas diarias
            const rows = []
            for (let d = 1; d <= m.days; d++) {
              const dd = String(d).padStart(2, '0')
              const k25 = `${m.m25}-${dd}`
              const k26 = `${m.m26}-${dd}`
              const v25 = d25[k25] ?? null
              const v26 = d26[k26] ?? null
              if (!v25 && !v26) continue
              const dow25 = DOW[new Date(k25 + 'T12:00:00').getDay()]
              const dow26 = DOW[new Date(k26 + 'T12:00:00').getDay()]
              const isToday = k26 === today
              let dv: number | null = null
              let pv: number | null = null
              if (v25 !== null && v26 !== null) { dv = r2(v26 - v25); pv = (dv / v25) * 100 }
              rows.push({ d, dd, k25, k26, v25, v26, dow25, dow26, isToday, dv, pv })
            }

            return (
              <div>
                <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '4px' }}>2025 · {m.label}</div>
                      <div style={{ fontFamily: 'system-ui', fontSize: '22px', fontWeight: '800', color: s.text2, letterSpacing: '-0.5px' }}>{fe(ms25.total)}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: s.text3, marginTop: '3px' }}>{ms25.dias} días · {fe(ms25.media)}/día</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '4px' }}>
                        2026 · {m.label}{partial && ult ? <span style={{ fontSize: '9px', color: s.gold }}> (hasta día {ult})</span> : ''}
                      </div>
                      <div style={{ fontFamily: 'system-ui', fontSize: '22px', fontWeight: '800', color: s.text, letterSpacing: '-0.5px' }}>{fe(ms26.total)}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: s.text3, marginTop: '3px' }}>{ms26.dias} días · {fe(ms26.media)}/día</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, width: '26px', flexShrink: 0 }}>2025</span>
                        <div style={{ flex: 1, height: '10px', background: s.bg4, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${w25}%`, background: s.text3, borderRadius: '2px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, width: '26px', flexShrink: 0 }}>2026</span>
                        <div style={{ flex: 1, height: '10px', background: s.bg4, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${w26}%`, background: s.text2, borderRadius: '2px' }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', textAlign: 'center', minWidth: '80px', borderRadius: '6px', border: `1px solid ${isPos ? s.grnDim : s.redDim}`, background: isPos ? s.grnBg : s.redBg }}>
                      <div style={{ fontFamily: 'system-ui', fontSize: '18px', fontWeight: '800', lineHeight: 1, color: isPos ? s.green : s.red }}>{pct !== null ? `${sgn(pct)}${pct.toFixed(1)}%` : '—'}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', marginTop: '3px', color: isPos ? s.green : s.red }}>{sgn(diff)}{fe(diff)}</div>
                    </div>
                  </div>
                </div>

                {/* Tabla diaria */}
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Detalle diario</div>
                <div style={{ border: `1px solid ${s.border}`, borderRadius: '8px', overflow: 'hidden', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '380px' }}>
                    <thead>
                      <tr style={{ background: s.bg3 }}>
                        {['Día 25', 'Caja 25', 'Día 26', 'Caja 26', 'Dif.', 'Var.'].map((h, i) => (
                          <th key={h} style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.6px', color: s.text3, padding: '9px 10px', textAlign: i > 1 ? 'right' : 'left', borderBottom: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} style={{ background: row.isToday ? 'rgba(240,180,41,.05)' : 'transparent', borderBottom: `1px solid ${s.border}` }}>
                          <td style={{ padding: '7px 10px', fontSize: '12px', color: s.text2 }}><span style={{ color: s.text3, fontSize: '10px', marginRight: '4px', fontFamily: 'monospace' }}>{row.d}</span>{row.dow25}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '12px', color: s.text3, textAlign: 'right' }}>{row.v25 !== null ? row.v25.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : <span style={{ fontStyle: 'italic', fontSize: '11px' }}>—</span>}</td>
                          <td style={{ padding: '7px 10px', fontSize: '12px', color: s.text2 }}><span style={{ color: s.text3, fontSize: '10px', marginRight: '4px', fontFamily: 'monospace' }}>{row.d}</span>{row.dow26}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '12px', color: s.text, fontWeight: '600', textAlign: 'right' }}>{row.v26 !== null ? row.v26.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : <span style={{ color: s.text3, fontStyle: 'italic', fontSize: '11px' }}>—</span>}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '12px', textAlign: 'right', color: row.dv !== null ? (row.dv >= 0 ? s.green : s.red) : s.text3, fontWeight: row.dv !== null ? '600' : '400' }}>
                            {row.dv !== null ? `${sgn(row.dv)}${row.dv.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                            {row.pv !== null ? (
                              <span style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: '10px', fontWeight: '500', padding: '2px 6px', borderRadius: '3px', background: row.pv >= 0 ? s.grnBg : s.redBg, color: row.pv >= 0 ? s.green : s.red, border: `1px solid ${row.pv >= 0 ? s.grnDim : s.redDim}` }}>
                                {sgn(row.pv)}{row.pv.toFixed(1)}%
                              </span>
                            ) : <span style={{ color: s.text3, fontStyle: 'italic', fontSize: '11px', fontFamily: 'monospace' }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: s.bg3, borderTop: `1px solid ${s.border2}` }}>
                        <td style={{ padding: '9px 10px', fontWeight: '700', fontSize: '12px', color: s.text }}><strong>TOTAL</strong></td>
                        <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '12px', color: s.text3, textAlign: 'right', fontWeight: '700' }}>{fe(ms25.total)}</td>
                        <td></td>
                        <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '12px', color: s.text, textAlign: 'right', fontWeight: '700' }}>{fe(ms26.total)}</td>
                        <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '12px', textAlign: 'right', fontWeight: '700', color: isPos ? s.green : s.red }}>{sgn(diff)}{fe(diff)}</td>
                        <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: '12px', textAlign: 'right', fontWeight: '700', color: isPos ? s.green : s.red }}>{pct !== null ? `${sgn(pct)}${pct.toFixed(1)}%` : '—'}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: s.text3, textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${s.border}`, lineHeight: 2, letterSpacing: '0.3px' }}>
        Datos: Supabase · Solo caja · Actualización en tiempo real
      </div>
    </div>
  )
}
