'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Packaging, TipoPackaging } from '@/types'
import { formatEuro2 } from '@/lib/metricas'

const EMPTY = { nombre: '', coste_unitario: 0, tipo: 'ambos' as TipoPackaging, descripcion: '' }

const TIPO_LABELS: Record<TipoPackaging, string> = {
  local: 'Tomar aquí',
  llevar: 'Para llevar',
  ambos: 'Ambos',
}

export default function PackagingPage() {
  const [items, setItems] = useState<Packaging[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Packaging | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [filterTipo, setFilterTipo] = useState<TipoPackaging | ''>('')

  async function load() {
    const { data } = await supabase.from('packaging').select('*').order('nombre')
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm({ ...EMPTY }); setShowForm(true) }
  function openEdit(p: Packaging) {
    setEditing(p)
    setForm({ nombre: p.nombre, coste_unitario: p.coste_unitario, tipo: p.tipo, descripcion: p.descripcion || '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.nombre.trim()) return
    setSaving(true)
    const payload = { ...form, descripcion: form.descripcion || null, updated_at: new Date().toISOString() }
    if (editing) {
      await supabase.from('packaging').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('packaging').insert(payload)
    }
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este packaging?')) return
    await supabase.from('packaging').delete().eq('id', id)
    load()
  }

  const filtered = filterTipo ? items.filter(p => p.tipo === filterTipo || p.tipo === 'ambos') : items

  const filters = [
    { value: '', label: 'Todos' },
    { value: 'local', label: 'Tomar aquí' },
    { value: 'llevar', label: 'Para llevar' },
    { value: 'ambos', label: 'Ambos' },
  ]

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#1F2937', marginBottom: '3px' }}>
            Packaging
          </h1>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{items.length} elementos registrados</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo packaging</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilterTipo(f.value as any)}
            style={{
              padding: '6px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
              backgroundColor: filterTipo === f.value ? '#2C1810' : 'white',
              color: filterTipo === f.value ? 'white' : '#4B5563',
              border: filterTipo === f.value ? '1px solid #2C1810' : '1px solid #E5E7EB',
              transition: 'all 0.1s',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Sin packaging</p>
          <p style={{ fontSize: '12px' }}>Añade el primero con el botón superior.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Nombre', 'Tipo', 'Coste unitario', 'Descripción', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: '500', color: '#1F2937' }}>{p.nombre}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span className="badge" style={{
                      backgroundColor: p.tipo === 'local' ? '#DBEAFE' : p.tipo === 'llevar' ? '#D1FAE5' : '#F3F4F6',
                      color: p.tipo === 'local' ? '#1D4ED8' : p.tipo === 'llevar' ? '#065F46' : '#4B5563',
                    }}>
                      {TIPO_LABELS[p.tipo]}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', fontVariantNumeric: 'tabular-nums', fontWeight: '600', color: '#2C1810' }}>{formatEuro2(p.coste_unitario)}</td>
                  <td style={{ padding: '11px 16px', fontSize: '12px', color: '#9CA3AF' }}>{p.descripcion || '—'}</td>
                  <td style={{ padding: '11px 16px' }}>
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
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginBottom: '20px' }}>
              {editing ? 'Editar packaging' : 'Nuevo packaging'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Caja cartón pequeña" className="input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Coste unitario (€)</label>
                  <input type="number" step="0.0001" min="0" value={form.coste_unitario}
                    onChange={e => setForm({ ...form, coste_unitario: parseFloat(e.target.value) || 0 })} className="input" />
                </div>
                <div>
                  <label className="label">Tipo de servicio</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoPackaging })} className="input">
                    <option value="local">Tomar aquí</option>
                    <option value="llevar">Para llevar</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Descripción</label>
                <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej: Bolsa kraft con logo CHUORE" className="input" />
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
