'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const euro = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
const fmtFecha = (f: string) => new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })

interface Venta { id: string; fecha: string; total: number; notas?: string }

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

  function openNew() { setEditing(null); setForm({ fecha: new Date().toISOString().split('T')[0], total: '', notas: '' }); setShowForm(true) }
  function openEdit(v: Venta) { setEditing(v); setForm({ fecha: v.fecha, total: String(v.total), notas: v.notas || '' }); setShowForm(true) }

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

  const totalMes = ventas.filter(v => !String(v.fecha).startsWith('2025')).reduce((s, v) => s + v.total, 0)
  const ventasReales = ventas.filter(v => !String(v.fecha).startsWith('2025'))
  const mediaDia = ventasReales.length > 0 ? totalMes / ventasReales.length : 0
  const mejorDia = ventasReales.length > 0 ? Math.max(...ventasReales.map(v => v.total)) : 0

  const mesesOpciones = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    return { val, label }
  })

  return (
    <div className="fade-in" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-subtitle">Registro diario del TPV</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Registrar venta</button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <select value={mes} onChange={e => setMes(e.target.value)} className="input" style={{ maxWidth: '240px' }}>
          {mesesOpciones.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total del mes', value: euro(totalMes) },
          { label: 'Media por día', value: euro(mediaDia) },
          { label: 'Mejor día', value: euro(mejorDia) },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <p className="stat-label">{k.label}</p>
            <p className="stat-value mono" style={{ fontSize: '18px', color: 'var(--c-brown)' }}>{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: '13px', color: 'var(--c-text-4)' }}>Cargando...</p>
      ) : ventas.length === 0 ? (
        <div className="card empty">
          <p className="empty-title">Sin registros este mes</p>
          <p className="empty-desc">Registra la primera venta con el botón superior.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th className="r">Total TPV</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: '500', color: 'var(--c-text-1)' }}>{fmtFecha(String(v.fecha))}</td>
                  <td className="r mono" style={{ fontWeight: '700', color: 'var(--c-green)', fontSize: '14px' }}>{euro(v.total)}</td>
                  <td style={{ color: 'var(--c-text-4)', fontSize: '12px' }}>{v.notas || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => openEdit(v)} className="btn btn-secondary btn-sm">Editar</button>
                      <button onClick={() => remove(v.id)} className="btn btn-danger btn-sm">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--c-surface-3)', display: 'flex', justifyContent: 'space-between', background: 'var(--c-surface-2)' }}>
            <span style={{ fontSize: '12px', color: 'var(--c-text-3)', fontWeight: '600' }}>{ventas.length} días registrados</span>
            <span className="mono" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--c-brown)' }}>Total: {euro(totalMes)}</span>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <p className="modal-title">{editing ? 'Editar venta' : 'Registrar venta'}</p>
              <button onClick={() => setShowForm(false)} className="btn-ghost btn btn-sm">✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Total TPV (€)</label>
                <input type="number" step="0.01" min="0" value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} placeholder="0.00" className="input" autoFocus />
              </div>
              <div>
                <label className="label">Notas (opcional)</label>
                <input type="text" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones del día..." className="input" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.total}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
