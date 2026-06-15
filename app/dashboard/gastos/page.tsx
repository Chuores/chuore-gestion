'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const euro = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
const fmtFecha = (f: string) => new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

interface CatGasto { id: string; nombre: string; color: string }
interface Proveedor { id: string; nombre: string }
interface Gasto { id: string; fecha: string; concepto: string; importe: number; categoria_id?: string; proveedor_id?: string; notas?: string; categoria?: CatGasto; proveedor?: Proveedor }

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [categorias, setCategorias] = useState<CatGasto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Gasto | null>(null)
  const [form, setForm] = useState({ fecha: new Date().toISOString().split('T')[0], concepto: '', importe: '', categoria_id: '', proveedor_id: '', notas: '' })
  const [saving, setSaving] = useState(false)
  const [mes, setMes] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
  const [filterCat, setFilterCat] = useState('')

  async function load() {
    const [year, month] = mes.split('-')
    const ini = `${year}-${month}-01`
    const fin = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]
    const [g, c, p] = await Promise.all([
      supabase.from('gastos').select('*, categoria:categorias_gasto(*), proveedor:proveedores(*)').gte('fecha', ini).lte('fecha', fin).order('fecha', { ascending: false }),
      supabase.from('categorias_gasto').select('*').order('nombre'),
      supabase.from('proveedores').select('*').order('nombre'),
    ])
    setGastos(g.data || [])
    setCategorias(c.data || [])
    setProveedores(p.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [mes])

  function openNew() { setEditing(null); setForm({ fecha: new Date().toISOString().split('T')[0], concepto: '', importe: '', categoria_id: '', proveedor_id: '', notas: '' }); setShowForm(true) }
  function openEdit(g: Gasto) { setEditing(g); setForm({ fecha: String(g.fecha), concepto: g.concepto, importe: String(g.importe), categoria_id: g.categoria_id || '', proveedor_id: g.proveedor_id || '', notas: g.notas || '' }); setShowForm(true) }

  async function save() {
    if (!form.concepto || !form.importe) return
    setSaving(true)
    const payload = { fecha: form.fecha, concepto: form.concepto, importe: parseFloat(form.importe), categoria_id: form.categoria_id || null, proveedor_id: form.proveedor_id || null, notas: form.notas || null }
    if (editing) await supabase.from('gastos').update(payload).eq('id', editing.id)
    else await supabase.from('gastos').insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    await supabase.from('gastos').delete().eq('id', id)
    load()
  }

  const filtered = filterCat ? gastos.filter(g => g.categoria_id === filterCat) : gastos
  const totalMes = filtered.reduce((s, g) => s + g.importe, 0)
  const totalGeneral = gastos.reduce((s, g) => s + g.importe, 0)

  const porCategoria = categorias.map(c => ({
    ...c,
    total: gastos.filter(g => g.categoria_id === c.id).reduce((s, g) => s + g.importe, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const mesesOpciones = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { val, label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }
  })

  return (
    <div className="fade-in" style={{ maxWidth: '920px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gastos</h1>
          <p className="page-subtitle">Registro por categoría</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Registrar gasto</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select value={mes} onChange={e => setMes(e.target.value)} className="input" style={{ maxWidth: '220px' }}>
          {mesesOpciones.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input" style={{ maxWidth: '200px' }}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {loading ? (
            <p style={{ fontSize: '13px', color: 'var(--c-text-4)' }}>Cargando...</p>
          ) : filtered.length === 0 ? (
            <div className="card empty">
              <p className="empty-title">Sin gastos este mes</p>
              <p className="empty-desc">Registra el primero con el botón superior.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Categoría</th>
                    <th className="r">Importe</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(g => (
                    <tr key={g.id}>
                      <td style={{ color: 'var(--c-text-3)', fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtFecha(String(g.fecha))}</td>
                      <td style={{ fontWeight: '500', color: 'var(--c-text-1)' }}>{g.concepto}</td>
                      <td>
                        {g.categoria ? (
                          <span className="badge" style={{ background: `${(g.categoria as any).color}18`, color: (g.categoria as any).color }}>
                            {(g.categoria as any).nombre}
                          </span>
                        ) : <span style={{ color: 'var(--c-text-4)', fontSize: '12px' }}>—</span>}
                      </td>
                      <td className="r mono" style={{ fontWeight: '700', color: 'var(--c-red)', fontSize: '14px' }}>{euro(g.importe)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => openEdit(g)} className="btn btn-secondary btn-sm">Editar</button>
                          <button onClick={() => remove(g.id)} className="btn btn-danger btn-sm">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--c-surface-3)', display: 'flex', justifyContent: 'space-between', background: 'var(--c-surface-2)' }}>
                <span style={{ fontSize: '12px', color: 'var(--c-text-3)', fontWeight: '600' }}>{filtered.length} registros</span>
                <span className="mono" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--c-red)' }}>Total: {euro(totalMes)}</span>
              </div>
            </div>
          )}
        </div>

        {porCategoria.length > 0 && (
          <div style={{ width: '220px', flexShrink: 0 }}>
            <div className="card" style={{ padding: '16px' }}>
              <p className="section-label" style={{ marginBottom: '12px' }}>Por categoría</p>
              {porCategoria.map(c => (
                <div key={c.id} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--c-text-2)', fontWeight: '500' }}>{c.nombre}</span>
                    <span className="mono" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--c-text-1)' }}>{euro(c.total)}</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--c-surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(c.total / totalGeneral) * 100}%`, background: c.color, borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--c-text-3)', fontWeight: '600' }}>Total</span>
                <span className="mono" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--c-red)' }}>{euro(totalGeneral)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <p className="modal-title">{editing ? 'Editar gasto' : 'Registrar gasto'}</p>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Importe (€)</label>
                  <input type="number" step="0.01" min="0" value={form.importe} onChange={e => setForm({ ...form, importe: e.target.value })} placeholder="0.00" className="input" autoFocus />
                </div>
              </div>
              <div>
                <label className="label">Concepto *</label>
                <input type="text" value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Ej: Factura harina mayo" className="input" />
              </div>
              <div>
                <label className="label">Categoría</label>
                <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })} className="input">
                  <option value="">Sin categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Proveedor (opcional)</label>
                <select value={form.proveedor_id} onChange={e => setForm({ ...form, proveedor_id: e.target.value })} className="input">
                  <option value="">Sin proveedor</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notas (opcional)</label>
                <input type="text" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones..." className="input" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.concepto || !form.importe}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
