'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Gasto, CategoriaGasto, Proveedor } from '@/types'

function euro(n: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n) }
function fmtFecha(f: string) { return new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) }

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([])
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

  function openNew() {
    setEditing(null)
    setForm({ fecha: new Date().toISOString().split('T')[0], concepto: '', importe: '', categoria_id: '', proveedor_id: '', notas: '' })
    setShowForm(true)
  }
  function openEdit(g: Gasto) {
    setEditing(g)
    setForm({ fecha: g.fecha, concepto: g.concepto, importe: String(g.importe), categoria_id: g.categoria_id || '', proveedor_id: g.proveedor_id || '', notas: g.notas || '' })
    setShowForm(true)
  }

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

  // Agrupación por categoría para el resumen
  const porCategoria = categorias.map(cat => ({
    ...cat,
    total: gastos.filter(g => g.categoria_id === cat.id).reduce((s, g) => s + g.importe, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const totalGeneral = gastos.reduce((s, g) => s + g.importe, 0)

  const mesesOpciones = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    return { val, label }
  })

  return (
    <div className="fade-in" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#1F2937', marginBottom: '3px' }}>Gastos</h1>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Registro por categoría</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Registrar gasto</button>
      </div>

      {/* Selector mes + filtro categoría */}
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
        {/* Lista de gastos */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Cargando...</p>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', marginBottom: '4px' }}>Sin gastos este mes</p>
              <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Registra el primero con el botón superior.</p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th className="th">Fecha</th>
                    <th className="th">Concepto</th>
                    <th className="th">Categoría</th>
                    <th className="th">Importe</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(g => (
                    <tr key={g.id} className="tr">
                      <td className="td" style={{ color: '#6B7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtFecha(g.fecha)}</td>
                      <td className="td" style={{ fontWeight: '500' }}>{g.concepto}</td>
                      <td className="td">
                        {g.categoria ? (
                          <span className="badge" style={{ backgroundColor: `${(g.categoria as any).color}18`, color: (g.categoria as any).color }}>
                            {(g.categoria as any).nombre}
                          </span>
                        ) : <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>}
                      </td>
                      <td className="td" style={{ fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#DC2626' }}>{euro(g.importe)}</td>
                      <td className="td">
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => openEdit(g)} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '12px' }}>Editar</button>
                          <button onClick={() => remove(g.id)} className="btn btn-danger" style={{ padding: '3px 8px', fontSize: '12px' }}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '12px 14px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', backgroundColor: '#FAFAFA' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>{filtered.length} registros</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>Total: {euro(totalMes)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Panel resumen por categoría */}
        {porCategoria.length > 0 && (
          <div style={{ width: '220px', flexShrink: 0 }}>
            <div className="card" style={{ padding: '16px' }}>
              <p className="section-title">Por categoría</p>
              {porCategoria.map(c => (
                <div key={c.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: '500' }}>{c.nombre}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F2937' }}>{euro(c.total)}</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: '#F3F4F6', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(c.total / totalGeneral) * 100}%`, backgroundColor: c.color, borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Total</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{euro(totalGeneral)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', marginBottom: '18px' }}>
              {editing ? 'Editar gasto' : 'Registrar gasto'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label">Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Importe (€)</label>
                  <input type="number" step="0.01" min="0" value={form.importe}
                    onChange={e => setForm({ ...form, importe: e.target.value })} placeholder="0.00" className="input" autoFocus />
                </div>
              </div>
              <div>
                <label className="label">Concepto *</label>
                <input type="text" value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })}
                  placeholder="Ej: Factura harina mayo" className="input" />
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
                <input type="text" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones..." className="input" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving || !form.concepto || !form.importe}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
