'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Proveedor } from '@/types'

const EMPTY = { nombre: '', telefono: '', email: '', notas: '' }

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Proveedor | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await supabase.from('proveedores').select('*').order('nombre')
    setProveedores(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm({ ...EMPTY }); setShowForm(true) }
  function openEdit(p: Proveedor) {
    setEditing(p)
    setForm({ nombre: p.nombre, telefono: p.telefono || '', email: p.email || '', notas: p.notas || '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.nombre.trim()) return
    setSaving(true)
    if (editing) {
      await supabase.from('proveedores').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      await supabase.from('proveedores').insert({ ...form })
    }
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este proveedor?')) return
    await supabase.from('proveedores').delete().eq('id', id)
    load()
  }

  const filtered = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#1F2937', marginBottom: '3px' }}>
            Proveedores
          </h1>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{proveedores.length} registrados</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo proveedor</button>
      </div>

      <input type="text" placeholder="Buscar proveedor..." value={search} onChange={e => setSearch(e.target.value)}
        className="input" style={{ marginBottom: '16px', maxWidth: '320px' }} />

      {loading ? (
        <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Sin proveedores</p>
          <p style={{ fontSize: '12px' }}>Añade el primero con el botón superior.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Nombre', 'Teléfono', 'Email', 'Notas', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: '#1F2937' }}>{p.nombre}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4B5563' }}>{p.telefono || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4B5563' }}>{p.email || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#9CA3AF', maxWidth: '200px' }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notas || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(p)} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', border: '1px solid #E5E7EB', background: 'white', color: '#4B5563', cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => remove(p.id)} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>Eliminar</button>
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
              {editing ? 'Editar proveedor' : 'Nuevo proveedor'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'nombre', label: 'Nombre *', type: 'text', placeholder: 'Nombre del proveedor' },
                { key: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '+34 600 000 000' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'proveedor@email.com' },
              ].map(field => (
                <div key={field.key}>
                  <label className="label">{field.label}</label>
                  <input type={field.type} value={(form as any)[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder} className="input" />
                </div>
              ))}
              <div>
                <label className="label">Notas</label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Horario de reparto, condiciones..." rows={3}
                  className="input" style={{ resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving || !form.nombre.trim()}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
