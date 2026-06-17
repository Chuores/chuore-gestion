'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Proveedor { id: string; nombre: string; telefono?: string; notas?: string }
interface ProductoPedido { id: string; codigo?: string; nombre: string; formato: string; unidad_pedido: string; precio_unidad: number; iva: number }
interface LineaPedido { producto: ProductoPedido; cantidad: number; observacion: string }

const CATALOGOS: Record<string, ProductoPedido[]> = {
  'Cash Galicia': [
    { id: 'cg1', codigo: '02157', nombre: 'Harina Haribosa Candeal 1kg', formato: 'Bulto x 10 uds', unidad_pedido: 'bultos', precio_unidad: 8.90, iva: 4 },
    { id: 'cg2', codigo: '21475', nombre: 'Leche LR Semidesnatada S/Lactosa 1L', formato: 'Bulto x 6 uds', unidad_pedido: 'bultos', precio_unidad: 5.34, iva: 4 },
    { id: 'cg3', codigo: '15266', nombre: 'Agua Cabreiroá 500cc', formato: 'Bulto x 24 uds', unidad_pedido: 'bultos', precio_unidad: 10.32, iva: 10 },
    { id: 'cg4', codigo: '05846', nombre: 'Refresco Coca Cola Lata 33cl', formato: 'Bulto x 24 uds', unidad_pedido: 'bultos', precio_unidad: 14.16, iva: 21 },
    { id: 'cg5', codigo: '20736', nombre: 'Servilletas Levian 20x20 2H 100uds', formato: 'Bulto x 60 uds', unidad_pedido: 'bultos', precio_unidad: 35.40, iva: 21 },
    { id: 'cg6', codigo: '21093', nombre: 'Leche Celta Hostelería 1,5L', formato: 'Bulto x 6 uds', unidad_pedido: 'bultos', precio_unidad: 8.34, iva: 4 },
  ],
  'Cash Record (Mercash)': [
    { id: 'cr1', codigo: '16902389', nombre: 'Agua Cabreiroá 500ml', formato: 'Caja x 8 uds', unidad_pedido: 'cajas', precio_unidad: 2.96, iva: 10 },
    { id: 'cr2', codigo: '04536934', nombre: 'Harina Tejedor 12/1kg', formato: 'Caja x 12 uds', unidad_pedido: 'cajas', precio_unidad: 10.20, iva: 4 },
    { id: 'cr3', codigo: '25086232', nombre: 'Queso Crema Chesson 1/2kg', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 14.95, iva: 4 },
    { id: 'cr4', codigo: '26989723', nombre: 'Mantequilla S/Sal Vaquera 8/1kg', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 9.75, iva: 10 },
    { id: 'cr5', codigo: '90065651', nombre: 'Removedor Café 500uds', formato: 'Caja x 1', unidad_pedido: 'cajas', precio_unidad: 5.49, iva: 21 },
    { id: 'cr6', codigo: '90065080', nombre: 'Portavasos 4u Divisible', formato: 'Caja x 12', unidad_pedido: 'cajas', precio_unidad: 3.49, iva: 21 },
    { id: 'cr7', codigo: '09193095', nombre: 'Lavavajillas Máq. Servihostel 6kg', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 6.65, iva: 21 },
    { id: 'cr8', codigo: '23332794', nombre: 'Coco Rallado Nogal 8/1kg', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 6.95, iva: 4 },
    { id: 'cr9', codigo: '90067265', nombre: 'Caja Bagazo Hamb 15x15x7,5 50u', formato: 'Caja x 10', unidad_pedido: 'cajas', precio_unidad: 5.49, iva: 21 },
  ],
  'PuroKoffee': [
    { id: 'pk1', codigo: '800368', nombre: 'Cápsula Rotondo Blue', formato: '100 uds', unidad_pedido: 'x100', precio_unidad: 32.20, iva: 21 },
    { id: 'pk2', codigo: '3200', nombre: 'Blue Trastevere Roma X2', formato: '100 uds', unidad_pedido: 'x100', precio_unidad: 51.10, iva: 21 },
    { id: 'pk3', codigo: '800320', nombre: 'Cápsula Descafeinado Blue', formato: '100 uds', unidad_pedido: 'x100', precio_unidad: 32.20, iva: 21 },
  ],
  'Martin Braun': [
    { id: 'mb1', codigo: '3306148', nombre: 'Chocolate a la Taza 1kg', formato: 'Unidad x 1kg', unidad_pedido: 'uds', precio_unidad: 8.10, iva: 10 },
    { id: 'mb2', codigo: '3300449', nombre: 'Salsa Dulce de Leche 1,2kg', formato: 'Unidad x 1,2kg', unidad_pedido: 'uds', precio_unidad: 8.05, iva: 10 },
    { id: 'mb3', codigo: '3306218', nombre: 'Confrutti Frutas del Bosque 3kg', formato: 'Unidad x 3kg', unidad_pedido: 'uds', precio_unidad: 18.06, iva: 10 },
    { id: 'mb4', nombre: 'Schokobella Pistacho 3kg', formato: 'Unidad x 3kg', unidad_pedido: 'uds', precio_unidad: 30.03, iva: 10 },
    { id: 'mb5', nombre: 'Schokobella Blanco 6kg', formato: 'Unidad x 6kg', unidad_pedido: 'uds', precio_unidad: 33.54, iva: 10 },
    { id: 'mb6', nombre: 'Schokobella Choco Leche 6kg', formato: 'Unidad x 6kg', unidad_pedido: 'uds', precio_unidad: 39.42, iva: 10 },
    { id: 'mb7', nombre: 'Deconube 1kg', formato: 'Unidad x 1kg', unidad_pedido: 'uds', precio_unidad: 8.05, iva: 10 },
    { id: 'mb8', nombre: 'Fruchtitop Manzana 5,5kg', formato: 'Unidad x 5,5kg', unidad_pedido: 'uds', precio_unidad: 20.79, iva: 10 },
  ],
  'Froiz': [
    { id: 'fr1', codigo: '45313', nombre: 'Aceite Abrilsol alto oleico 5L', formato: 'Caja x 3 uds', unidad_pedido: 'cajas', precio_unidad: 28.50, iva: 10 },
    { id: 'fr2', codigo: '46677', nombre: 'Azúcar blanco Acor 1kg', formato: 'Caja x 10 uds', unidad_pedido: 'cajas', precio_unidad: 7.60, iva: 10 },
    { id: 'fr3', codigo: '00413', nombre: 'Azúcar moreno caña Acor 1kg', formato: 'Caja x 9 uds', unidad_pedido: 'cajas', precio_unidad: 13.59, iva: 10 },
    { id: 'fr4', codigo: '05014', nombre: 'Sal marina gruesa 1kg', formato: 'Caja x 12 uds', unidad_pedido: 'cajas', precio_unidad: 3.36, iva: 10 },
    { id: 'fr5', codigo: '01570', nombre: 'Coca-Cola lata 33cl', formato: 'Caja x 24 uds', unidad_pedido: 'cajas', precio_unidad: 13.92, iva: 21 },
    { id: 'fr6', codigo: '03400', nombre: 'Coca-Cola Zero lata 33cl', formato: 'Caja x 24 uds', unidad_pedido: 'cajas', precio_unidad: 13.92, iva: 21 },
    { id: 'fr7', codigo: '01633', nombre: 'Aquarius limón lata 33cl', formato: 'Caja x 24 uds', unidad_pedido: 'cajas', precio_unidad: 15.36, iva: 21 },
    { id: 'fr8', codigo: '13290', nombre: 'Canela Molida 600g', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 4.95, iva: 10 },
    { id: 'fr9', codigo: '07411', nombre: 'Azúcar blanco sobres 300g (50 sobres)', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 0.95, iva: 10 },
    { id: 'fr10', codigo: '07408', nombre: 'Azúcar moreno sobres 300g (50 sobres)', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 0.96, iva: 10 },
    { id: 'fr11', codigo: '33632', nombre: 'Zumo Pago naranja 200ml', formato: 'Caja x 24 uds', unidad_pedido: 'cajas', precio_unidad: 19.68, iva: 21 },
    { id: 'fr12', codigo: '21183', nombre: 'Café Bonka natural grano 1kg', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 15.83, iva: 10 },
    { id: 'fr13', codigo: '045486', nombre: 'Vajillas Zorka máquinas 6kg', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 7.35, iva: 21 },
    { id: 'fr14', codigo: '045121', nombre: 'Abrillantador Zorka 5L', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 8.30, iva: 21 },
    { id: 'fr15', codigo: '51190', nombre: 'Bebida Avena Froiz calcio 0% 1L', formato: 'Caja x 6 uds', unidad_pedido: 'cajas', precio_unidad: 3.66, iva: 10 },
  ],
  'Bolsas Juncaril': [
    { id: 'bj1', codigo: '000987', nombre: 'Papel Asa Plana Blanca 32+22x25 GR80', formato: '100 bolsas', unidad_pedido: 'x100', precio_unidad: 12.50, iva: 21 },
    { id: 'bj2', codigo: '001014', nombre: 'Papel Asa Plana Blanca 28+16x29 GR80', formato: '100 bolsas', unidad_pedido: 'x100', precio_unidad: 10.20, iva: 21 },
  ],
}

const euro = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

export default function PedidosPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [selectedProv, setSelectedProv] = useState<Proveedor | null>(null)
  const [lineas, setLineas] = useState<LineaPedido[]>([])
  const [notaGeneral, setNotaGeneral] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    supabase.from('proveedores').select('*').order('nombre').then(({ data }) => {
      setProveedores(data || [])
      setLoading(false)
    })
  }, [])

  function selectProveedor(prov: Proveedor) {
    setSelectedProv(prov)
    setLineas([])
    setNotaGeneral('')
    setFechaEntrega('')
  }

  const catalogo = selectedProv ? (CATALOGOS[selectedProv.nombre] || []) : []
  const idsEnPedido = lineas.map(l => l.producto.id)

  function toggleProducto(p: ProductoPedido) {
    if (idsEnPedido.includes(p.id)) {
      setLineas(prev => prev.filter(l => l.producto.id !== p.id))
    } else {
      setLineas(prev => [...prev, { producto: p, cantidad: 1, observacion: '' }])
    }
  }

  function updateCantidad(id: string, val: number) {
    setLineas(prev => prev.map(l => l.producto.id === id ? { ...l, cantidad: Math.max(0, val) } : l))
  }

  function updateObs(id: string, val: string) {
    setLineas(prev => prev.map(l => l.producto.id === id ? { ...l, observacion: val } : l))
  }

  const lineasValidas = lineas.filter(l => l.cantidad > 0)
  const totalEstimado = lineasValidas.reduce((s, l) => s + l.cantidad * l.producto.precio_unidad * (1 + l.producto.iva / 100), 0)

  function generarMensaje() {
    if (!selectedProv || lineasValidas.length === 0) return ''
    const hoy = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    const sep = '─────────────────────────'
    let msg = `PEDIDO CHUORE\n${hoy}\n`
    if (fechaEntrega) msg += `\nEntrega solicitada: ${fechaEntrega}\n`
    msg += `\n${sep}\n`
    lineasValidas.forEach(l => {
      const cod = l.producto.codigo ? `[${l.producto.codigo}] ` : ''
      // Calcular total de unidades si es posible
      const formatoMatch = l.producto.formato.match(/x\s*(\d+)/i)
      const udsPorUnidad = formatoMatch ? parseInt(formatoMatch[1]) : null
      const totalUds = udsPorUnidad ? l.cantidad * udsPorUnidad : null
      msg += `${cod}${l.producto.nombre}\n`
      if (totalUds) {
        msg += `        ${l.cantidad} ${l.producto.unidad_pedido} x ${udsPorUnidad} uds = ${totalUds} uds\n`
      } else {
        msg += `        ${l.cantidad} ${l.producto.unidad_pedido}\n`
      }
      if (l.observacion) msg += `        Nota: ${l.observacion}\n`
      msg += `\n`
    })
    msg += `${sep}\n`
    if (notaGeneral) msg += `\nObservaciones: ${notaGeneral}\n`
    msg += `\nCHUORE Churros & More\nRua Senra, 20 · Santiago de Compostela`
    return msg
  }

  function abrirWhatsApp() {
    if (!selectedProv?.telefono) return
    const tel = selectedProv.telefono.split('/')[0].replace(/\s/g, '').replace('+', '')
    const numero = tel.startsWith('34') ? tel : `34${tel}`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(generarMensaje())}`, '_blank')
  }

  async function copiarMensaje() {
    await navigator.clipboard.writeText(generarMensaje())
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '20px', height: '20px', border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
    </div>
  )

  const PROVEEDORES_CON_CATALOGO = proveedores.filter(p => CATALOGOS[p.nombre])

  return (
    <div className="fade-in" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">Genera pedidos y envíalos por WhatsApp</p>
        </div>
      </div>

      {!selectedProv ? (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px' }}>Selecciona el proveedor:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {PROVEEDORES_CON_CATALOGO.map(prov => (
              <button key={prov.id} onClick={() => selectProveedor(prov)}
                style={{ padding: '16px', borderRadius: '10px', border: '2px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(200,24,30,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-1)', marginBottom: '4px' }}>{prov.nombre}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>{CATALOGOS[prov.nombre]?.length || 0} productos</p>
                {prov.telefono && <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>📱 {prov.telefono.split('/')[0].trim()}</p>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px 16px', background: 'var(--surface)', border: '2px solid var(--red)', borderRadius: '10px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-1)' }}>{selectedProv.nombre}</p>
              {selectedProv.telefono && <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>{selectedProv.telefono}</p>}
            </div>
            <button onClick={() => setSelectedProv(null)} className="btn btn-secondary btn-sm">← Cambiar</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Catálogo — pulsa para añadir</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {catalogo.map(p => {
                  const enPedido = idsEnPedido.includes(p.id)
                  return (
                    <button key={p.id} onClick={() => toggleProducto(p)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${enPedido ? 'var(--red)' : 'var(--border)'}`, background: enPedido ? '#FFF0F0' : 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s', textAlign: 'left' }}>
                      <div>
                        {p.codigo && <p style={{ fontSize: '10px', color: 'var(--text-4)', marginBottom: '1px' }}>#{p.codigo}</p>}
                        <p style={{ fontSize: '13px', fontWeight: '500', color: enPedido ? 'var(--red)' : 'var(--text-1)' }}>{p.nombre}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>{p.formato}</p>
                      </div>
                      <span style={{ fontSize: '20px', color: enPedido ? 'var(--red)' : 'var(--border-2)', marginLeft: '8px' }}>{enPedido ? '✓' : '+'}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Pedido actual</p>
              {lineas.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>Pulsa + en los productos para añadirlos.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {lineas.map(linea => (
                      <div key={linea.producto.id} className="card" style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-1)' }}>{linea.producto.nombre}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>{linea.producto.formato}</p>
                          </div>
                          <button onClick={() => toggleProducto(linea.producto)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: '18px', padding: '0 4px' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => updateCantidad(linea.producto.id, linea.cantidad - 1)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '2px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>−</button>
                          <input type="number" value={linea.cantidad} min="0" onChange={e => updateCantidad(linea.producto.id, parseInt(e.target.value) || 0)} style={{ width: '60px', textAlign: 'center', fontWeight: '700', fontSize: '16px', padding: '5px', border: '2px solid var(--border)', borderRadius: '6px', fontFamily: 'inherit', outline: 'none' }} />
                          <button onClick={() => updateCantidad(linea.producto.id, linea.cantidad + 1)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '2px solid var(--red)', background: 'var(--red)', color: 'white', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>+</button>
                          <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{linea.producto.unidad_pedido}</span>
                        </div>
                        <input type="text" value={linea.observacion} placeholder="Observación..." onChange={e => updateObs(linea.producto.id, e.target.value)} style={{ marginTop: '8px', width: '100%', padding: '6px 10px', border: '2px solid var(--border)', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }} />
                        {linea.cantidad > 0 && <p style={{ fontSize: '11px', color: 'var(--text-4)', textAlign: 'right', marginTop: '4px' }}>≈ {euro(linea.cantidad * linea.producto.precio_unidad * (1 + linea.producto.iva / 100))}</p>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="text" value={fechaEntrega} placeholder="Fecha de entrega (ej: Lunes 23 junio)" onChange={e => setFechaEntrega(e.target.value)} style={{ padding: '8px 12px', border: '2px solid var(--border)', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
                    <textarea value={notaGeneral} placeholder="Nota general..." rows={2} onChange={e => setNotaGeneral(e.target.value)} style={{ padding: '8px 12px', border: '2px solid var(--border)', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', resize: 'none', outline: 'none' }} />
                    {totalEstimado > 0 && (
                      <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: '8px', border: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Total estimado con IVA</span>
                        <span style={{ fontSize: '14px', fontWeight: '700' }}>{euro(totalEstimado)}</span>
                      </div>
                    )}
                    {lineasValidas.length > 0 && (
                      <div style={{ background: '#F0FBF5', border: '2px solid #A3E4C1', borderRadius: '8px', padding: '12px', maxHeight: '180px', overflowY: 'auto' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--green)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vista previa</p>
                        <pre style={{ fontSize: '11px', color: 'var(--text-2)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>{generarMensaje()}</pre>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedProv.telefono && (
                        <button onClick={abrirWhatsApp} disabled={lineasValidas.length === 0} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #1DA851', background: lineasValidas.length > 0 ? '#25D366' : 'var(--border)', color: 'white', fontSize: '14px', fontWeight: '700', cursor: lineasValidas.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp
                        </button>
                      )}
                      <button onClick={copiarMensaje} disabled={lineasValidas.length === 0} className="btn btn-secondary" style={{ padding: '12px 16px', border: '2px solid var(--border)' }}>
                        {copiado ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
