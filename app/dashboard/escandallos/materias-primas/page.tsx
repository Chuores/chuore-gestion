'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MateriaPrima, Proveedor, IvaCompra, UnidadMateriaPrima } from '@/types'
import { UNIDADES, IVA_COMPRA_OPTIONS, formatEuro2 } from '@/lib/metricas'

const EMPTY = { nombre: '', unidad: 'kg' as UnidadMateriaPrima, precio_sin_iva: 0, iva_compra: 10 as IvaCompra, proveedor_id: '' }

export default function MateriasPrimasPage() {
  const [items, setItems] = useState<MateriaPrima[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MateriaPrima | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterProveedor, setFilterProveedor] = useState('')

  async function load() {
    const [mp, prov] = await Promise.all([
      supabase.from('materias_primas').select('*, proveedor:proveedores(*)').order('nombre'),
      supabase.from('proveedores').select('*').order('nombre'),
    ])
    setItems(mp.data || [])
    setProveedores(prov.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm({ ...EMPTY }); setShowForm(true) }
  function openEdit(mp: MateriaPrima) {
    setEditing(mp)
    setForm({ nombre: mp.nombre, unidad: mp.unidad, precio_sin_iva: mp.precio_sin_iva, iva_compra: mp.iva_compra, proveedor_id: mp.proveedor_id || '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.nombre.trim()) return
    setSaving(true)
    const precio_con_iva = form.precio_sin_iva * (1 + form.iva_compra / 100)
    const payload = { ...form, precio_con_iva, proveedor_id: form.proveedor_id || null, updated_at: new Date().toISOString() }
    if (editing) {
      await supabase.from('materias_primas').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('materias_primas').insert(payload)
    }
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta materia prima?')) return
    await supabase.from('materias_primas').delete().eq('id', id)
    load()
  }

  const filtered = items.filter(mp => {
    const matchSearch = mp.nombre.toLowerCase().includes(search.toLowerCase())
    const matchProv = !filterProveedor || mp.proveedor_id === filterProveedor
    return matchSearch && matchProv
  })

  const precioConIva = form.precio_sin_iva * (1 + form.iva_compra / 100)

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#1F2937', marginBottom: '3px' }}>
            Materias primas
          </h1>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{items.length} ingredientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva materia prima</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input type="text" placeholder="Buscar ingrediente..." value={search} onChange={e => setSearch(e.target.value)}
          className="input" style={{ maxWidth: '280px' }} />
        <select value={filterProveedor} onChange={e => setFilterProveedor(e.target.value)}
          className="input" style={{ maxWidth: '220px' }}>
          <option value="">Todos los proveedores</option>
          {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Sin materias primas</p>
          <p style={{ fontSize: '12px' }}>Añade la primera con el botón superior.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Nombre', 'Unidad', 'Precio s/IVA', 'IVA', 'Precio c/IVA', 'Proveedor', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((mp, i) => (
                <tr key={mp.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: '500', color: '#1F2937' }}>{mp.nombre}</td>
                  <td style={{ padding: '11px 16px', fontSize: '12px', color: '#6B7280' }}>{mp.unidad}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', fontVariantNumeric: 'tabular-nums', color: '#1F2937' }}>{formatEuro2(mp.precio_sin_iva)}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>{mp.iva_compra}%</span>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', fontVariantNumeric: 'tabular-nums', fontWeight: '600', color: '#2C1810' }}>{formatEuro2(mp.precio_con_iva)}</td>
                  <td style={{ padding: '11px 16px', fontSize: '12px', color: '#6B7280' }}>{(mp.proveedor as any)?.nombre || '—'}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(mp)} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', border: '1px solid #E5E7EB', background: 'white', color: '#4B5563', cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => remove(mp.id)} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginBottom: '20px' }}>
              {editing ? 'Editar materia prima' : 'Nueva materia prima'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Harina de trigo" className="input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Unidad</label>
                  <select value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value as UnidadMateriaPrima })} className="input">
                    {UNIDADES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">IVA compra</label>
                  <select value={form.iva_compra} onChange={e => setForm({ ...form, iva_compra: Number(e.target.value) as IvaCompra })} className="input">
                    {IVA_COMPRA_OPTIONS.map(iva => <option key={iva} value={iva}>{iva}%</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Precio sin IVA (€ por {form.unidad})</label>
                <input type="number" step="0.0001" min="0" value={form.precio_sin_iva}
                  onChange={e => setForm({ ...form, precio_sin_iva: parseFloat(e.target.value) || 0 })} className="input" />
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                  Con IVA ({form.iva_compra}%): <strong style={{ color: '#2C1810' }}>{formatEuro2(precioConIva)}</strong>
                </p>
              </div>
              <div>
                <label className="label">Proveedor</label>
                <select value={form.proveedor_id} onChange={e => setForm({ ...form, proveedor_id: e.target.value })} className="input">
                  <option value="">Sin proveedor asignado</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving || !form.nombre.trim()}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
