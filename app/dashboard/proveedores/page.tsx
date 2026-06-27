'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Proveedor { id: string; nombre: string; telefono?: string; email?: string; notas?: string; created_at: string; updated_at: string }
const EMPTY = { nombre: '', telefono: '', email: '', notas: '' }

export default function ProveedoresPage() {
  const [items, setItems] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Proveedor | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await supabase.from('proveedores').select('*').order('nombre')
    setItems(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm({ ...EMPTY }); setShowForm(true) }
  function openEdit(p: Proveedor) { setEditing(p); setForm({ nombre: p.nombre, telefono: p.telefono || '', email: p.email || '', notas: p.notas || '' }); setShowForm(true) }

  async function save() {
    if (!form.nombre.trim()) return
    setSaving(true)
    if (editing) await supabase.from('proveedores').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
    else await supabase.from('proveedores').insert({ ...form })
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este proveedor?')) return
    await supabase.from('proveedores').delete().eq('id', id); load()
  }

  const filtered = items.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fade-in" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">{items.length} registrados</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo proveedor</button>
      </div>

      <input type="text" placeholder="Buscar proveedor..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ marginBottom: '16px', maxWidth: '320px' }} />

      {loading ? <p style={{ fontSize: '13px', color: 'var(--c-text-4)' }}>Cargando...</p> :
        filtered.length === 0 ? (
          <div className="card empty">
            <p className="empty-title">Sin proveedores</p>
            <p className="empty-desc">Añade el primero con el botón superior.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th><th>Teléfono</th><th>Email</th><th>Notas</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: '600', color: 'var(--c-text-1)' }}>{p.nombre}</td>
                    <td style={{ fontSize: '12px' }}>{p.telefono ? <a href={`tel:${p.telefono.split('/')[0].trim()}`} style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: '500' }}>{p.telefono}</a> : '—'}</td>
                    <td style={{ fontSize: '12px' }}>{p.email ? <a href={`mailto:${p.email}`} style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: '500' }}>{p.email}</a> : '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--c-text-4)', maxWidth: '200px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notas || '—'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm">Editar</button>
                        <button onClick={() => remove(p.id)} className="btn btn-danger btn-sm">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <p className="modal-title">{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</p>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'nombre', label: 'Nombre *', type: 'text', placeholder: 'Nombre del proveedor' },
                { key: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '+34 600 000 000' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'proveedor@email.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} className="input" />
                </div>
              ))}
              <div>
                <label className="label">Notas</label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Horario de reparto, condiciones..." rows={3} className="input" style={{ resize: 'none' }} />
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
