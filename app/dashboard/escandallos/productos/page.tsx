'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Producto, MateriaPrima, Packaging, CategoriaProducto, TipoPackaging } from '@/types'
import { calcularMetricas, formatEuro, formatEuro2, formatPorcentaje, CATEGORIAS } from '@/lib/metricas'

const EMPTY_PRODUCTO = {
  nombre: '', categoria: 'churros' as CategoriaProducto, pvp_con_iva: 0,
  iva_venta: 10 as const, merma_porcentaje: 0, coste_mano_obra: 0,
  coste_energia: 0, coste_otros_operativos: 0, activo: true, notas: '',
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([])
  const [packagings, setPackagings] = useState<Packaging[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaProducto | ''>('')
  const [search, setSearch] = useState('')
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [form, setForm] = useState({ ...EMPTY_PRODUCTO })
  const [ingredientes, setIngredientes] = useState<{ materia_prima_id: string; cantidad: number }[]>([])
  const [pkgLines, setPkgLines] = useState<{ packaging_id: string; cantidad: number; tipo_servicio: TipoPackaging }[]>([])
  const [saving, setSaving] = useState(false)

  async function load() {
    const [prods, mps, pkgs] = await Promise.all([
      supabase.from('productos').select(`*, ingredientes:producto_ingredientes(*, materia_prima:materias_primas(*)), packagings:producto_packagings(*, packaging:packaging(*))`).order('categoria').order('nombre'),
      supabase.from('materias_primas').select('*').order('nombre'),
      supabase.from('packaging').select('*').order('nombre'),
    ])
    setProductos(prods.data || [])
    setMateriasPrimas(mps.data || [])
    setPackagings(pkgs.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null); setForm({ ...EMPTY_PRODUCTO })
    setIngredientes([{ materia_prima_id: '', cantidad: 0 }])
    setPkgLines([{ packaging_id: '', cantidad: 1, tipo_servicio: 'local' }])
    setShowForm(true)
  }

  function openEdit(p: Producto) {
    setEditing(p)
    setForm({ nombre: p.nombre, categoria: p.categoria, pvp_con_iva: p.pvp_con_iva, iva_venta: 10, merma_porcentaje: p.merma_porcentaje, coste_mano_obra: p.coste_mano_obra, coste_energia: p.coste_energia, coste_otros_operativos: p.coste_otros_operativos, activo: p.activo, notas: p.notas || '' })
    setIngredientes((p.ingredientes || []).map(i => ({ materia_prima_id: i.materia_prima_id, cantidad: i.cantidad })))
    setPkgLines((p.packagings || []).map(pk => ({ packaging_id: pk.packaging_id, cantidad: pk.cantidad, tipo_servicio: pk.tipo_servicio })))
    setShowForm(true)
  }

  async function save() {
    if (!form.nombre.trim()) return
    setSaving(true)
    let productId = editing?.id
    if (editing) {
      await supabase.from('productos').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
      await supabase.from('producto_ingredientes').delete().eq('producto_id', editing.id)
      await supabase.from('producto_packagings').delete().eq('producto_id', editing.id)
    } else {
      const { data } = await supabase.from('productos').insert({ ...form }).select().single()
      productId = data?.id
    }
    if (productId) {
      const validIngr = ingredientes.filter(i => i.materia_prima_id && i.cantidad > 0)
      if (validIngr.length > 0) await supabase.from('producto_ingredientes').insert(validIngr.map(i => ({ producto_id: productId, ...i })))
      const validPkg = pkgLines.filter(p => p.packaging_id && p.cantidad > 0)
      if (validPkg.length > 0) await supabase.from('producto_packagings').insert(validPkg.map(p => ({ producto_id: productId, ...p })))
    }
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('producto_ingredientes').delete().eq('producto_id', id)
    await supabase.from('producto_packagings').delete().eq('producto_id', id)
    await supabase.from('productos').delete().eq('id', id)
    if (selectedProducto?.id === id) setSelectedProducto(null)
    load()
  }

  const filtered = productos.filter(p => {
    const matchCat = !selectedCategoria || p.categoria === selectedCategoria
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const grouped = CATEGORIAS.map(cat => ({
    ...cat,
    items: filtered.filter(p => p.categoria === cat.value)
  })).filter(g => g.items.length > 0)

  const metricas = selectedProducto ? calcularMetricas(selectedProducto) : null

  const margenColor = (m: number) => m >= 60 ? '#15803D' : m >= 40 ? '#D97706' : '#DC2626'

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#1F2937', marginBottom: '3px' }}>
            Escandallos
          </h1>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{productos.length} productos — selecciona uno para ver el análisis completo</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo producto</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)}
          className="input" style={{ maxWidth: '220px' }} />
        <button onClick={() => setSelectedCategoria('')}
          style={{ padding: '7px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', border: '1px solid', transition: 'all 0.1s', backgroundColor: !selectedCategoria ? '#2C1810' : 'white', color: !selectedCategoria ? 'white' : '#4B5563', borderColor: !selectedCategoria ? '#2C1810' : '#E5E7EB' }}>
          Todos
        </button>
        {CATEGORIAS.map(cat => (
          <button key={cat.value} onClick={() => setSelectedCategoria(cat.value as CategoriaProducto)}
            style={{ padding: '7px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', border: '1px solid', transition: 'all 0.1s', backgroundColor: selectedCategoria === cat.value ? '#2C1810' : 'white', color: selectedCategoria === cat.value ? 'white' : '#4B5563', borderColor: selectedCategoria === cat.value ? '#2C1810' : '#E5E7EB' }}>
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Lista */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Cargando...</p> : grouped.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Sin productos</p>
              <p style={{ fontSize: '12px' }}>Añade el primero con el botón superior.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {grouped.map(group => (
                <div key={group.value}>
                  <p className="section-title" style={{ marginBottom: '8px' }}>{group.label}</p>
                  <div className="card" style={{ overflow: 'hidden' }}>
                    {group.items.map((p, i) => {
                      const m = calcularMetricas(p)
                      const isSelected = selectedProducto?.id === p.id
                      return (
                        <div key={p.id} onClick={() => setSelectedProducto(isSelected ? null : p)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', cursor: 'pointer', transition: 'background-color 0.1s',
                            borderBottom: i < group.items.length - 1 ? '1px solid #F3F4F6' : 'none',
                            backgroundColor: isSelected ? '#FAF6EF' : 'white',
                            borderLeft: isSelected ? '3px solid #B8860B' : '3px solid transparent',
                          }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: '500', color: '#1F2937', marginBottom: '2px' }}>{p.nombre}</p>
                            <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              Coste: {formatEuro2(m.coste_total_local)} · Food cost: {formatPorcentaje(m.food_cost_total_local)}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1F2937' }}>{formatEuro2(p.pvp_con_iva)}</p>
                              <p style={{ fontSize: '11px', fontWeight: '700', color: margenColor(m.margen_local) }}>{formatPorcentaje(m.margen_local)}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => openEdit(p)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #E5E7EB', background: 'white', color: '#4B5563', cursor: 'pointer' }}>Editar</button>
                              <button onClick={() => remove(p.id)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>Eliminar</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel métricas */}
        {selectedProducto && metricas && (
          <div style={{ width: '300px', flexShrink: 0, position: 'sticky', top: '0' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '2px' }}>{selectedProducto.nombre}</p>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {CATEGORIAS.find(c => c.value === selectedProducto.categoria)?.label}
                  </p>
                </div>
                <button onClick={() => setSelectedProducto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '16px', lineHeight: 1 }}>×</button>
              </div>

              {/* PVP */}
              <div style={{ backgroundColor: '#2C1810', borderRadius: '6px', padding: '14px', marginBottom: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#B8860B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>PVP (IVA incluido)</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'white', fontVariantNumeric: 'tabular-nums' }}>{formatEuro2(metricas.pvp_con_iva)}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Sin IVA: {formatEuro2(metricas.pvp_sin_iva)}</p>
              </div>

              {/* Costes */}
              <p className="section-title">Costes — tomar aquí</p>
              <div style={{ marginBottom: '12px' }}>
                <div className="metric-row"><span className="metric-label">Materias primas</span><span className="metric-value">{formatEuro(metricas.coste_materias_primas)}</span></div>
                <div className="metric-row"><span className="metric-label">Packaging</span><span className="metric-value">{formatEuro(metricas.coste_packaging_local)}</span></div>
                <div className="metric-row"><span className="metric-label">Costes operativos</span><span className="metric-value">{formatEuro(metricas.coste_operativo)}</span></div>
                <div className="metric-row" style={{ borderBottom: 'none' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>Coste total</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>{formatEuro2(metricas.coste_total_local)}</span>
                </div>
              </div>

              {/* Rentabilidad */}
              <p className="section-title">Rentabilidad</p>
              <div style={{ marginBottom: '12px' }}>
                <div className="metric-row"><span className="metric-label">Beneficio bruto</span><span className="metric-value">{formatEuro2(metricas.beneficio_bruto_local)}</span></div>
                <div className="metric-row">
                  <span className="metric-label">Margen neto</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: margenColor(metricas.margen_local), fontVariantNumeric: 'tabular-nums' }}>{formatPorcentaje(metricas.margen_local)}</span>
                </div>
                <div className="metric-row"><span className="metric-label">Food cost (MP)</span><span className="metric-value">{formatPorcentaje(metricas.food_cost)}</span></div>
                <div className="metric-row" style={{ borderBottom: 'none' }}><span className="metric-label">Food cost total</span><span className="metric-value">{formatPorcentaje(metricas.food_cost_total_local)}</span></div>
              </div>

              {/* Para llevar */}
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                <p className="section-title" style={{ marginBottom: '8px' }}>Para llevar</p>
                <div className="metric-row"><span className="metric-label">Coste total</span><span className="metric-value">{formatEuro2(metricas.coste_total_llevar)}</span></div>
                <div className="metric-row"><span className="metric-label">Beneficio bruto</span><span className="metric-value">{formatEuro2(metricas.beneficio_bruto_llevar)}</span></div>
                <div className="metric-row" style={{ borderBottom: 'none' }}>
                  <span className="metric-label">Margen</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: margenColor(metricas.margen_llevar), fontVariantNumeric: 'tabular-nums' }}>{formatPorcentaje(metricas.margen_llevar)}</span>
                </div>
              </div>

              {/* Receta */}
              {selectedProducto.ingredientes && selectedProducto.ingredientes.length > 0 && (
                <>
                  <p className="section-title">Receta</p>
                  <div>
                    {selectedProducto.ingredientes.map((ing, i) => (
                      <div key={i} className="metric-row" style={{ borderBottom: i < selectedProducto.ingredientes!.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>{ing.materia_prima?.nombre} · {ing.cantidad} {ing.materia_prima?.unidad}</span>
                        <span style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums', color: '#1F2937' }}>{formatEuro((ing.materia_prima?.precio_sin_iva || 0) * ing.cantidad)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '28px', margin: 'auto' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginBottom: '20px' }}>
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Ración churros pequeña" className="input" />
              </div>
              <div>
                <label className="label">Categoría</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as CategoriaProducto })} className="input">
                  {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">PVP con IVA (€)</label>
                <input type="number" step="0.01" min="0" value={form.pvp_con_iva}
                  onChange={e => setForm({ ...form, pvp_con_iva: parseFloat(e.target.value) || 0 })} className="input" />
              </div>
              <div>
                <label className="label">Merma (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={form.merma_porcentaje}
                  onChange={e => setForm({ ...form, merma_porcentaje: parseFloat(e.target.value) || 0 })} className="input" />
              </div>
              <div>
                <label className="label">Mano de obra (€)</label>
                <input type="number" step="0.001" min="0" value={form.coste_mano_obra}
                  onChange={e => setForm({ ...form, coste_mano_obra: parseFloat(e.target.value) || 0 })} className="input" />
              </div>
              <div>
                <label className="label">Energía (€)</label>
                <input type="number" step="0.001" min="0" value={form.coste_energia}
                  onChange={e => setForm({ ...form, coste_energia: parseFloat(e.target.value) || 0 })} className="input" />
              </div>
              <div>
                <label className="label">Otros operativos (€)</label>
                <input type="number" step="0.001" min="0" value={form.coste_otros_operativos}
                  onChange={e => setForm({ ...form, coste_otros_operativos: parseFloat(e.target.value) || 0 })} className="input" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Notas</label>
                <input type="text" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones sobre este producto..." className="input" />
              </div>
            </div>

            {/* Ingredientes */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingredientes</p>
                <button onClick={() => setIngredientes([...ingredientes, { materia_prima_id: '', cantidad: 0 }])}
                  style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '4px', border: '1px solid #E5E7EB', background: 'white', color: '#4B5563', cursor: 'pointer' }}>
                  + Añadir
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ingredientes.map((ing, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px' }}>
                    <select value={ing.materia_prima_id}
                      onChange={e => { const arr = [...ingredientes]; arr[i].materia_prima_id = e.target.value; setIngredientes(arr) }}
                      className="input" style={{ flex: 1 }}>
                      <option value="">Seleccionar ingrediente</option>
                      {materiasPrimas.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre} ({mp.unidad})</option>)}
                    </select>
                    <input type="number" step="0.001" min="0" value={ing.cantidad} placeholder="Cantidad"
                      onChange={e => { const arr = [...ingredientes]; arr[i].cantidad = parseFloat(e.target.value) || 0; setIngredientes(arr) }}
                      className="input" style={{ width: '100px' }} />
                    <button onClick={() => setIngredientes(ingredientes.filter((_, j) => j !== i))}
                      style={{ padding: '0 10px', borderRadius: '4px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '14px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Packaging */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Packaging</p>
                <button onClick={() => setPkgLines([...pkgLines, { packaging_id: '', cantidad: 1, tipo_servicio: 'local' }])}
                  style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '4px', border: '1px solid #E5E7EB', background: 'white', color: '#4B5563', cursor: 'pointer' }}>
                  + Añadir
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pkgLines.map((pk, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px' }}>
                    <select value={pk.packaging_id}
                      onChange={e => { const arr = [...pkgLines]; arr[i].packaging_id = e.target.value; setPkgLines(arr) }}
                      className="input" style={{ flex: 1 }}>
                      <option value="">Seleccionar packaging</option>
                      {packagings.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <input type="number" min="1" value={pk.cantidad}
                      onChange={e => { const arr = [...pkgLines]; arr[i].cantidad = parseInt(e.target.value) || 1; setPkgLines(arr) }}
                      className="input" style={{ width: '60px' }} placeholder="Ud" />
                    <select value={pk.tipo_servicio}
                      onChange={e => { const arr = [...pkgLines]; arr[i].tipo_servicio = e.target.value as TipoPackaging; setPkgLines(arr) }}
                      className="input" style={{ width: '140px' }}>
                      <option value="local">Tomar aquí</option>
                      <option value="llevar">Para llevar</option>
                      <option value="ambos">Ambos</option>
                    </select>
                    <button onClick={() => setPkgLines(pkgLines.filter((_, j) => j !== i))}
                      style={{ padding: '0 10px', borderRadius: '4px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '14px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving || !form.nombre.trim()}>
                {saving ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
