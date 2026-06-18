'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const euro = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)
const pct = (n: number) => `${n.toFixed(1)}%`

interface MP { id: string; nombre: string; precio_con_iva: number; unidad: string }
interface PKG { id: string; nombre: string; coste_unitario: number }
interface Ingrediente { materia_prima: MP; cantidad: number }
interface PkgLinea { packaging: PKG; cantidad: number }

interface Producto {
  id: string; nombre: string; categoria: string
  pvp_con_iva: number; iva_venta: number
  coste_energia: number; coste_mano_obra: number; coste_otros_operativos: number
  merma_porcentaje: number; notas?: string; activo: boolean
  ingredientes?: Ingrediente[]
  packagings?: PkgLinea[]
}

const CATS = ['Todos', 'churros', 'bebidas', 'canelitos', 'combos', 'fusion', 'otros']

export default function EscandallProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Producto | null>(null)
  const [cat, setCat] = useState('churros')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nombre: '', categoria: 'churros', pvp_con_iva: '', iva_venta: '10', coste_energia: '0', coste_mano_obra: '0', coste_otros_operativos: '0', merma_porcentaje: '0', notas: '' })

  async function load() {
    const { data } = await supabase
      .from('productos')
      .select(`*, producto_ingredientes(cantidad, materia_prima:materias_primas(id,nombre,precio_con_iva,unidad)), producto_packagings(cantidad, packaging:packaging(id,nombre,coste_unitario))`)
      .order('categoria').order('nombre')
    const mapped = (data || []).map((p: any) => ({
      ...p,
      ingredientes: (p.producto_ingredientes || []).map((pi: any) => ({ materia_prima: pi.materia_prima, cantidad: pi.cantidad })),
      packagings: (p.producto_packagings || []).map((pp: any) => ({ packaging: pp.packaging, cantidad: pp.cantidad })),
    }))
    setProductos(mapped)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function calcCostes(p: Producto) {
    const mp = (p.ingredientes || []).reduce((s, i) => s + (i.materia_prima?.precio_con_iva || 0) * i.cantidad, 0)
    const pkg = (p.packagings || []).reduce((s, pp) => s + (pp.packaging?.coste_unitario || 0) * pp.cantidad, 0)
    const merma = mp * (p.merma_porcentaje / 100)
    const total = mp + pkg + merma + (p.coste_energia || 0) + (p.coste_mano_obra || 0) + (p.coste_otros_operativos || 0)
    const pvpSinIva = p.pvp_con_iva / (1 + p.iva_venta / 100)
    const beneficio = pvpSinIva - total
    const margen = pvpSinIva > 0 ? (beneficio / pvpSinIva) * 100 : 0
    const foodCostPct = pvpSinIva > 0 ? (total / pvpSinIva) * 100 : 0
    return { mp, pkg, merma, total, pvpSinIva, beneficio, margen, foodCostPct }
  }

  function openNew() {
    setEditing(null)
    setForm({ nombre: '', categoria: cat === 'Todos' ? 'churros' : cat, pvp_con_iva: '', iva_venta: '10', coste_energia: '0', coste_mano_obra: '0', coste_otros_operativos: '0', merma_porcentaje: '0', notas: '' })
    setShowForm(true)
  }

  function openEdit(p: Producto) {
    setEditing(p)
    setForm({ nombre: p.nombre, categoria: p.categoria, pvp_con_iva: String(p.pvp_con_iva), iva_venta: String(p.iva_venta), coste_energia: String(p.coste_energia || 0), coste_mano_obra: String(p.coste_mano_obra || 0), coste_otros_operativos: String(p.coste_otros_operativos || 0), merma_porcentaje: String(p.merma_porcentaje || 0), notas: p.notas || '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.nombre || !form.pvp_con_iva) return
    setSaving(true)
    const payload = { nombre: form.nombre, categoria: form.categoria, pvp_con_iva: parseFloat(form.pvp_con_iva), iva_venta: parseFloat(form.iva_venta), coste_energia: parseFloat(form.coste_energia), coste_mano_obra: parseFloat(form.coste_mano_obra), coste_otros_operativos: parseFloat(form.coste_otros_operativos), merma_porcentaje: parseFloat(form.merma_porcentaje), notas: form.notas || null }
    if (editing) await supabase.from('productos').update(payload).eq('id', editing.id)
    else await supabase.from('productos').insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('producto_ingredientes').delete().eq('producto_id', id)
    await supabase.from('producto_packagings').delete().eq('producto_id', id)
    await supabase.from('productos').delete().eq('id', id)
    setSelected(null); load()
  }

  function descargarFicha(p: Producto) {
    const c = calcCostes(p)
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Ficha ${p.nombre}</title>
<style>
body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;color:#111;font-size:13px}
h1{font-size:20px;margin-bottom:4px}
.sub{color:#888;font-size:11px;margin-bottom:24px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th{text-align:left;font-size:10px;text-transform:uppercase;color:#888;padding:6px 8px;border-bottom:2px solid #eee}
td{padding:7px 8px;border-bottom:1px solid #f0f0f0;font-size:13px}
td:last-child{text-align:right;font-weight:600}
.total td{font-weight:700;border-top:2px solid #111;border-bottom:none}
.kpi{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.kpi-box{background:#f8f8f8;border-radius:8px;padding:12px 14px}
.kpi-label{font-size:10px;text-transform:uppercase;color:#888;margin-bottom:4px}
.kpi-value{font-size:18px;font-weight:700}
.green{color:#1a7a4a}.red{color:#c0392b}.gold{color:#b8860b}
.footer{margin-top:32px;font-size:10px;color:#bbb;border-top:1px solid #eee;padding-top:12px}
@media print{button{display:none}}
</style></head><body>
<button onclick="window.print()" style="float:right;padding:8px 16px;background:#C8181E;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px">Imprimir / PDF</button>
<h1>${p.nombre}</h1>
<p class="sub">${p.categoria.toUpperCase()} · CHUORE Churros & More</p>

<div class="kpi">
  <div class="kpi-box"><div class="kpi-label">PVP con IVA</div><div class="kpi-value">${euro(p.pvp_con_iva)}</div></div>
  <div class="kpi-box"><div class="kpi-label">Venta neta sin IVA</div><div class="kpi-value">${euro(c.pvpSinIva)}</div></div>
  <div class="kpi-box"><div class="kpi-label">Food cost total</div><div class="kpi-value ${c.foodCostPct > 30 ? 'red' : 'green'}">${euro(c.total)} (${pct(c.foodCostPct)})</div></div>
  <div class="kpi-box"><div class="kpi-label">Beneficio bruto</div><div class="kpi-value ${c.beneficio >= 0 ? 'green' : 'red'}">${euro(c.beneficio)}</div></div>
  <div class="kpi-box"><div class="kpi-label">Margen bruto</div><div class="kpi-value ${c.margen >= 70 ? 'green' : c.margen >= 50 ? 'gold' : 'red'}">${pct(c.margen)}</div></div>
  <div class="kpi-box"><div class="kpi-label">IVA venta</div><div class="kpi-value">${p.iva_venta}%</div></div>
</div>

${p.ingredientes && p.ingredientes.length > 0 ? `
<h3 style="font-size:13px;margin-bottom:8px">Materias primas</h3>
<table>
<tr><th>Ingrediente</th><th>Cantidad</th><th>Coste</th></tr>
${p.ingredientes.map(i => `<tr><td>${i.materia_prima?.nombre}</td><td>${i.cantidad} ${i.materia_prima?.unidad}</td><td>${euro((i.materia_prima?.precio_con_iva || 0) * i.cantidad)}</td></tr>`).join('')}
${c.merma > 0 ? `<tr><td colspan="2">Merma (${p.merma_porcentaje}%)</td><td>${euro(c.merma)}</td></tr>` : ''}
<tr class="total"><td colspan="2">Subtotal MP</td><td>${euro(c.mp + c.merma)}</td></tr>
</table>` : '<p style="color:#888;font-size:12px">Sin ingredientes registrados</p>'}

${p.packagings && p.packagings.length > 0 ? `
<h3 style="font-size:13px;margin-bottom:8px">Packaging</h3>
<table>
<tr><th>Elemento</th><th>Uds</th><th>Coste</th></tr>
${p.packagings.map(pp => `<tr><td>${pp.packaging?.nombre}</td><td>${pp.cantidad}</td><td>${euro((pp.packaging?.coste_unitario || 0) * pp.cantidad)}</td></tr>`).join('')}
<tr class="total"><td colspan="2">Subtotal packaging</td><td>${euro(c.pkg)}</td></tr>
</table>` : ''}

<h3 style="font-size:13px;margin-bottom:8px">Costes operativos</h3>
<table>
${c.total > 0 ? `<tr><td>Energía imputada</td><td>${euro(p.coste_energia || 0)}</td></tr>` : ''}
${(p.coste_mano_obra || 0) > 0 ? `<tr><td>Mano de obra</td><td>${euro(p.coste_mano_obra)}</td></tr>` : ''}
${(p.coste_otros_operativos || 0) > 0 ? `<tr><td>Otros operativos</td><td>${euro(p.coste_otros_operativos)}</td></tr>` : ''}
<tr class="total"><td>COSTE TOTAL</td><td>${euro(c.total)}</td></tr>
</table>

${p.notas ? `<p style="background:#f8f8f8;padding:10px 12px;border-radius:6px;font-size:12px;color:#555">${p.notas}</p>` : ''}

<div class="footer">CHUORE Churros & More · Santiago de Compostela · Ficha generada el ${new Date().toLocaleDateString('es-ES')}</div>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `ficha-${p.nombre.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
    a.click(); URL.revokeObjectURL(url)
  }

  const filtrados = productos.filter(p => {
    const matchCat = cat === 'Todos' || p.categoria === cat
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const selCostes = selected ? calcCostes(selected) : null

  return (
    <div className="fade-in" style={{ maxWidth: '1100px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Escandallos — Productos</h1>
          <p className="page-subtitle">{productos.length} productos en catálogo</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo producto</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`filter-pill ${cat === c ? 'active' : ''}`}>{c}</button>
        ))}
        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ maxWidth: '200px', marginLeft: 'auto' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '16px' }}>
        {/* Lista */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="r">PVP</th>
                <th className="r">Food cost</th>
                <th className="r">Margen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-4)' }}>Sin productos</td></tr>
              ) : filtrados.map(p => {
                const c = calcCostes(p)
                const isSelected = selected?.id === p.id
                return (
                  <tr key={p.id} onClick={() => setSelected(isSelected ? null : p)} style={{ cursor: 'pointer', background: isSelected ? 'var(--c-red-bg)' : undefined }}>
                    <td style={{ fontWeight: '500', color: 'var(--text-1)' }}>{p.nombre}</td>
                    <td><span className="badge badge-gray">{p.categoria}</span></td>
                    <td className="r mono" style={{ fontWeight: '600' }}>{euro(p.pvp_con_iva)}</td>
                    <td className="r mono" style={{ color: c.total > 0 ? (c.foodCostPct > 30 ? 'var(--c-red)' : 'var(--green)') : 'var(--text-4)' }}>
                      {c.total > 0 ? `${euro(c.total)} (${pct(c.foodCostPct)})` : '—'}
                    </td>
                    <td className="r mono" style={{ fontWeight: '700', color: c.margen >= 70 ? 'var(--green)' : c.margen >= 50 ? 'var(--amber)' : c.margen > 0 ? 'var(--c-red)' : 'var(--text-4)' }}>
                      {c.margen > 0 ? pct(c.margen) : '—'}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Panel detalle */}
        {selected && selCostes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="card">
              <div className="card-header">
                <p className="card-title">{selected.nombre}</p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => descargarFicha(selected)}>⬇ Ficha</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
                </div>
              </div>
              <div style={{ padding: '14px' }}>
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  {[
                    { label: 'PVP con IVA', value: euro(selected.pvp_con_iva), color: 'var(--text-1)' },
                    { label: `IVA (${selected.iva_venta}%)`, value: euro(selected.pvp_con_iva - selCostes.pvpSinIva), color: 'var(--text-3)' },
                    { label: 'Venta neta', value: euro(selCostes.pvpSinIva), color: 'var(--text-1)' },
                    { label: 'Food cost', value: euro(selCostes.total), color: selCostes.foodCostPct > 30 ? 'var(--c-red)' : 'var(--green)' },
                    { label: 'Beneficio bruto', value: euro(selCostes.beneficio), color: selCostes.beneficio >= 0 ? 'var(--green)' : 'var(--c-red)' },
                    { label: 'Margen bruto', value: pct(selCostes.margen), color: selCostes.margen >= 70 ? 'var(--green)' : selCostes.margen >= 50 ? 'var(--amber)' : 'var(--c-red)' },
                    { label: 'Food cost %', value: pct(selCostes.foodCostPct), color: selCostes.foodCostPct > 30 ? 'var(--c-red)' : 'var(--green)' },
                  ].map(k => (
                    <div key={k.label} style={{ background: 'var(--surface-2)', borderRadius: '7px', padding: '10px' }}>
                      <p style={{ fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{k.label}</p>
                      <p className="mono" style={{ fontSize: '15px', fontWeight: '700', color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Ingredientes */}
                {selected.ingredientes && selected.ingredientes.length > 0 && (
                  <>
                    <p className="section-label">Materias primas</p>
                    {selected.ingredientes.map((i, idx) => (
                      <div key={idx} className="metric-row">
                        <span className="metric-label">{i.materia_prima?.nombre}</span>
                        <span className="metric-value mono">{euro((i.materia_prima?.precio_con_iva || 0) * i.cantidad)}</span>
                      </div>
                    ))}
                    {selCostes.merma > 0 && (
                      <div className="metric-row">
                        <span className="metric-label">Merma ({selected.merma_porcentaje}%)</span>
                        <span className="metric-value mono">{euro(selCostes.merma)}</span>
                      </div>
                    )}
                    <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
                  </>
                )}

                {/* Packaging */}
                {selected.packagings && selected.packagings.length > 0 && (
                  <>
                    <p className="section-label" style={{ marginTop: '8px' }}>Packaging</p>
                    {selected.packagings.map((pp, idx) => (
                      <div key={idx} className="metric-row">
                        <span className="metric-label">{pp.packaging?.nombre}</span>
                        <span className="metric-value mono">{euro((pp.packaging?.coste_unitario || 0) * pp.cantidad)}</span>
                      </div>
                    ))}
                    <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
                  </>
                )}

                {/* Operativos */}
                <p className="section-label" style={{ marginTop: '8px' }}>Costes operativos</p>
                {[
                  { label: 'Energía', val: selected.coste_energia },
                  { label: 'Mano de obra', val: selected.coste_mano_obra },
                  { label: 'Otros', val: selected.coste_otros_operativos },
                ].filter(x => x.val > 0).map(x => (
                  <div key={x.label} className="metric-row">
                    <span className="metric-label">{x.label}</span>
                    <span className="metric-value mono">{euro(x.val)}</span>
                  </div>
                ))}
                <div className="metric-row" style={{ borderTop: '2px solid var(--border)', marginTop: '4px' }}>
                  <span style={{ fontWeight: '700', fontSize: '13px' }}>COSTE TOTAL</span>
                  <span className="mono" style={{ fontWeight: '700', fontSize: '14px', color: 'var(--c-red)' }}>{euro(selCostes.total)}</span>
                </div>

                {selected.notas && (
                  <div style={{ marginTop: '10px', padding: '8px 10px', background: 'var(--surface-2)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-3)' }}>
                    {selected.notas}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <p className="modal-title">{editing ? 'Editar producto' : 'Nuevo producto'}</p>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="input" placeholder="Nombre del producto" autoFocus />
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="input">
                    {['churros', 'bebidas', 'canelitos', 'combos', 'fusion', 'otros'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">IVA venta (%)</label>
                  <input type="number" value={form.iva_venta} onChange={e => setForm({ ...form, iva_venta: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">PVP con IVA (€)</label>
                  <input type="number" step="0.01" value={form.pvp_con_iva} onChange={e => setForm({ ...form, pvp_con_iva: e.target.value })} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Merma (%)</label>
                  <input type="number" step="0.1" value={form.merma_porcentaje} onChange={e => setForm({ ...form, merma_porcentaje: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Energía (€)</label>
                  <input type="number" step="0.001" value={form.coste_energia} onChange={e => setForm({ ...form, coste_energia: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Mano de obra (€)</label>
                  <input type="number" step="0.01" value={form.coste_mano_obra} onChange={e => setForm({ ...form, coste_mano_obra: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Otros operativos (€)</label>
                  <input type="number" step="0.01" value={form.coste_otros_operativos} onChange={e => setForm({ ...form, coste_otros_operativos: e.target.value })} className="input" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Notas</label>
                  <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="input" rows={2} style={{ resize: 'none' }} placeholder="Observaciones..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.nombre || !form.pvp_con_iva}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
