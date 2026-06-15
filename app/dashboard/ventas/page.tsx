'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Venta } from '@/types'

function euro(n: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n) }
function fmtFecha(f: string) { return new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) }

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Venta | null>(null)
  const [form, setForm] = useState({ fecha: new Date().toISOString().split('T')[0], total: '', notas: '' })
  const [saving, setSaving] = useState(false)
  const [mes, setMes] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })

  async function load() {
    const [year, month] = mes.split('-')
    const ini = `${year}-${month}-01`
    const fin = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]
    const { data } = await supabase.from('ventas').select('*').gte('fecha', ini).lte('fecha', fin).order('fecha', { ascending: false })
    setVentas(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [mes])

  function openNew() {
    setEditing(null)
    setForm({ fecha: new Date().toISOString().split('T')[0], total: '', notas: '' })
    setShowForm(true)
  }
  function openEdit(v: Venta) {
    setEditing(v)
    setForm({ fecha: v.fecha, total: String(v.total), notas: v.notas || '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.total) return
    setSaving(true)
    const payload = { fecha: form.fecha, total: parseFloat(form.total), notas: form.notas || null }
    if (editing) await supabase.from('ventas').update(payload).eq('id', editing.id)
    else await supabase.from('ventas').insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    await supabase.from('ventas').delete().eq('id', id)
    load()
  }

  const totalMes = ventas.reduce((s, v) => s + v.total, 0)
  const mediaDia = ventas.length > 0 ? totalMes / ventas.length : 0
  const mejorDia = ventas.length > 0 ? Math.max(...ventas.map(v => v.total)) : 0

  // Generar meses disponibles (últimos 12)
  const mesesOpciones = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    return { val, label }
  })

  return (
    <div className="fade-in" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#1F2937', marginBottom: '3px' }}>Ventas</h1>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Registro diario del TPV</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Registrar venta</button>
      </div>

      {/* Selector de mes */}
      <div style={{ marginBottom: '20px' }}>
        <select value={mes} onChange={e => setMes(e.target.value)} className="input" style={{ maxWidth: '240px' }}>
          {mesesOpciones.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
      </div>

      {/* KPIs del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total del mes', value: euro(totalMes) },
          { label: 'Media por día', value: euro(mediaDia) },
          { label: 'Mejor día', value: euro(mejorDia) },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{k.label}</p>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#2C1810', fontVariantNumeric: 'tabular-nums' }}>{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Cargando...</p>
      ) : ventas.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', marginBottom: '4px' }}>Sin registros este mes</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Registra la primera venta con el botón superior.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="th">Fecha</th>
                <th className="th">Total TPV</th>
                <th className="th">Notas</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id} className="tr">
                  <td className="td" style={{ fontWeight: '500' }}>{fmtFecha(v.fecha)}</td>
                  <td className="td" style={{ fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#15803D', fontSize: '14px' }}>{euro(v.total)}</td>
                  <td className="td" style={{ color: '#9CA3AF', fontSize: '12px' }}>{v.notas || '—'}</td>
                  <td className="td">
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(v)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Editar</button>
                      <button onClick={() => remove(v.id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 14px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', backgroundColor: '#FAFAFA' }}>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>{ventas.length} días registrados</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#2C1810', fontVariantNumeric: 'tabular-nums' }}>Total: {euro(totalMes)}</span>
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', marginBottom: '18px' }}>
              {editing ? 'Editar venta' : 'Registrar venta'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="label">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Total TPV (€)</label>
                <input type="number" step="0.01" min="0" value={form.total}
                  onChange={e => setForm({ ...form, total: e.target.value })}
                  placeholder="0.00" className="input" autoFocus />
              </div>
              <div>
                <label className="label">Notas (opcional)</label>
                <input type="text" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones del día..." className="input" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving || !form.total}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
