'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface MP { id: string; nombre: string; unidad: string; precio_sin_iva: number; iva_compra: number; precio_con_iva: number; proveedor_id?: string; categoria?: string; proveedor?: { nombre: string } }
const EMPTY = { nombre: '', unidad: 'kg', precio_sin_iva: '', iva_compra: '10', precio_con_iva: '', proveedor_id: '', categoria: 'Varios' }

export default function MateriasPrimasPage() {
  const [items, setItems] = useState<MP[]>([])
  const [proveedores, setProveedores] = useState<{id:string;nombre:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MP | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const CATS = ['Aceites','Azúcares','Bebidas','Café','Chocolate','Cremas y Salsas','Especias','Galletas','Harinas','Lácteos','Limpieza','Toppings','Varios']

  async function load() {
    const [mp, prov] = await Promise.all([
      supabase.from('materias_primas').select('*, proveedor:proveedores(nombre)').order('categoria').order('nombre'),
      supabase.from('proveedores').select('id, nombre').order('nombre'),
    ])
    setItems(mp.data || [])
    setProveedores(prov.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm({ ...EMPTY }); setShowForm(true) }
  function openEdit(mp: MP) {
    setEditing(mp)
    setForm({ nombre: mp.nombre, unidad: mp.unidad, precio_sin_iva: String(mp.precio_sin_iva), iva_compra: String(mp.iva_compra), precio_con_iva: String(mp.precio_con_iva), proveedor_id: mp.proveedor_id || '', categoria: mp.categoria || 'Varios' })
    setShowForm(true)
  }

  async function save() {
    if (!form.nombre.trim()) return
    setSaving(true)
    const payload = { nombre: form.nombre, unidad: form.unidad, precio_sin_iva: parseFloat(form.precio_sin_iva) || 0, iva_compra: parseFloat(form.iva_compra) || 0, precio_con_iva: parseFloat(form.precio_con_iva) || 0, proveedor_id: form.proveedor_id || null, categoria: form.categoria }
    if (editing) await supabase.from('materias_primas').update(payload).eq('id', editing.id)
    else await supabase.from('materias_primas').insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar?')) return
    await supabase.from('materias_primas').delete().eq('id', id); load()
  }

  const filtered = items.filter(mp => {
    const matchSearch = mp.nombre.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || mp.categoria === filterCat
    return matchSearch && matchCat
  })

  // Agrupar por categoría
  const grouped: Record<string, MP[]> = {}
  filtered.forEach(mp => {
    const cat = mp.categoria || 'Varios'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(mp)
  })

  return (
    <div className="fade-in" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Materias primas</h1>
          <p className="page-subtitle">{items.length} registradas</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva materia prima</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ maxWidth: '200px' }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input" style={{ maxWidth: '180px' }}>
          <option value="">Todas las categorías</option>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: 'var(--text-4)', fontSize: '13px' }}>Cargando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(grouped).map(([cat, mps]) => (
            <div key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat}</p>
                <span className="badge badge-gray">{mps.length}</span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nombre</th><th>Unidad</th><th>Proveedor</th><th className="r">Sin IVA</th><th className="r">IVA</th><th className="r">Con IVA</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mps.map(mp => (
                      <tr key={mp.id}>
                        <td style={{ fontWeight: '500', color: 'var(--text-1)' }}>{mp.nombre}</td>
                        <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{mp.unidad}</td>
                        <td style={{ color: 'var(--text-4)', fontSize: '12px' }}>{mp.proveedor ? (mp.proveedor as any).nombre : '—'}</td>
                        <td className="r mono">{mp.precio_sin_iva.toFixed(4)} €</td>
                        <td className="r mono" style={{ color: 'var(--text-4)' }}>{mp.iva_compra}%</td>
                        <td className="r mono" style={{ fontWeight: '600', color: 'var(--red)' }}>{mp.precio_con_iva.toFixed(4)} €</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(mp)}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => remove(mp.id)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <p className="modal-title">{editing ? 'Editar materia prima' : 'Nueva materia prima'}</p>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="input" placeholder="Nombre del ingrediente" autoFocus />
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="input">
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Unidad</label>
                  <select value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} className="input">
                    {['kg','g','l','ml','ud'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Precio sin IVA (€)</label>
                  <input type="number" step="0.0001" value={form.precio_sin_iva} onChange={e => setForm({ ...form, precio_sin_iva: e.target.value })} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">IVA compra (%)</label>
                  <select value={form.iva_compra} onChange={e => setForm({ ...form, iva_compra: e.target.value })} className="input">
                    {['4','10','21'].map(v => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Precio con IVA (€)</label>
                  <input type="number" step="0.0001" value={form.precio_con_iva} onChange={e => setForm({ ...form, precio_con_iva: e.target.value })} className="input" placeholder="0.00" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Proveedor</label>
                  <select value={form.proveedor_id} onChange={e => setForm({ ...form, proveedor_id: e.target.value })} className="input">
                    <option value="">Sin proveedor</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.nombre.trim()}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
