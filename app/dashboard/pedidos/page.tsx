'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Proveedor {
  id: string
  nombre: string
  telefono?: string
  notas?: string
}

interface MateriaPrima {
  id: string
  nombre: string
  unidad: string
  precio_con_iva: number
  proveedor_id?: string
}

interface LineaPedido {
  mp: MateriaPrima
  cantidad: string
  observacion: string
}

const euro = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

export default function PedidosPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([])
  const [selectedProv, setSelectedProv] = useState<Proveedor | null>(null)
  const [lineas, setLineas] = useState<LineaPedido[]>([])
  const [notaGeneral, setNotaGeneral] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [p, mp] = await Promise.all([
        supabase.from('proveedores').select('*').order('nombre'),
        supabase.from('materias_primas').select('*').order('nombre'),
      ])
      setProveedores(p.data || [])
      setMateriasPrimas(mp.data || [])
      setLoading(false)
    }
    load()
  }, [])

  function selectProveedor(prov: Proveedor) {
    setSelectedProv(prov)
    setLineas([])
    setNotaGeneral('')
    setFechaEntrega('')
  }

  const mpDelProv = selectedProv
    ? materiasPrimas.filter(mp => mp.proveedor_id === selectedProv.id)
    : []

  const mpEnPedido = lineas.map(l => l.mp.id)

  function addLinea(mp: MateriaPrima) {
    if (mpEnPedido.includes(mp.id)) return
    setLineas(prev => [...prev, { mp, cantidad: '', observacion: '' }])
  }

  function removeLinea(id: string) {
    setLineas(prev => prev.filter(l => l.mp.id !== id))
  }

  function updateLinea(id: string, field: 'cantidad' | 'observacion', value: string) {
    setLineas(prev => prev.map(l => l.mp.id === id ? { ...l, [field]: value } : l))
  }

  const totalEstimado = lineas.reduce((s, l) => {
    const qty = parseFloat(l.cantidad) || 0
    return s + qty * l.mp.precio_con_iva
  }, 0)

  const lineasConCantidad = lineas.filter(l => l.cantidad && parseFloat(l.cantidad) > 0)

  function generarMensaje() {
    if (!selectedProv || lineasConCantidad.length === 0) return ''

    const fecha = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    let msg = `🛒 *PEDIDO CHUORE*\n`
    msg += `📅 ${fecha}\n`
    if (fechaEntrega) msg += `🚚 Entrega: ${fechaEntrega}\n`
    msg += `\n`

    lineasConCantidad.forEach(l => {
      msg += `• ${l.mp.nombre} — *${l.cantidad} ${l.mp.unidad}*`
      if (l.observacion) msg += ` _(${l.observacion})_`
      msg += `\n`
    })

    if (notaGeneral) msg += `\n📝 ${notaGeneral}`
    msg += `\n\n_CHUORE Churros & More · Santiago de Compostela_`
    return msg
  }

  function abrirWhatsApp() {
    if (!selectedProv?.telefono) return
    const tel = selectedProv.telefono.replace(/\s/g, '').replace('+', '')
    const numero = tel.startsWith('34') ? tel : `34${tel.split('/')[0].trim()}`
    const msg = encodeURIComponent(generarMensaje())
    window.open(`https://wa.me/${numero}?text=${msg}`, '_blank')
  }

  function copiarMensaje() {
    navigator.clipboard.writeText(generarMensaje())
    alert('Mensaje copiado al portapapeles')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '20px', height: '20px', border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
    </div>
  )

  return (
    <div className="fade-in" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">Genera pedidos y envíalos por WhatsApp</p>
        </div>
      </div>

      {/* Selector de proveedor */}
      {!selectedProv ? (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px', fontWeight: '500' }}>
            Selecciona el proveedor al que quieres hacer el pedido:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {proveedores.filter(p => p.telefono).map(prov => (
              <button
                key={prov.id}
                onClick={() => selectProveedor(prov)}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: '2px solid var(--border)',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--red)'
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(200,24,30,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '4px' }}>{prov.nombre}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>{prov.telefono}</p>
                {prov.notas && (
                  <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px', lineHeight: 1.4 }}>
                    {prov.notas.slice(0, 60)}{prov.notas.length > 60 ? '...' : ''}
                  </p>
                )}
              </button>
            ))}
          </div>

          {proveedores.filter(p => !p.telefono).length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '10px' }}>Pedido online (sin WhatsApp):</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {proveedores.filter(p => !p.telefono).map(prov => (
                  <button
                    key={prov.id}
                    onClick={() => selectProveedor(prov)}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px' }}
                  >
                    {prov.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Header proveedor seleccionado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '14px 16px', background: 'var(--surface)', border: '2px solid var(--red)', borderRadius: '10px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-1)' }}>{selectedProv.nombre}</p>
              {selectedProv.telefono && (
                <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>{selectedProv.telefono}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedProv(null)}
              className="btn btn-secondary btn-sm"
            >
              Cambiar
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Panel izquierdo — productos disponibles */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Productos de {selectedProv.nombre}
              </p>

              {mpDelProv.length === 0 ? (
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>No hay materias primas asignadas a este proveedor.</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>Ve a Materias primas y asígnalas.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {mpDelProv.map(mp => {
                    const enPedido = mpEnPedido.includes(mp.id)
                    return (
                      <button
                        key={mp.id}
                        onClick={() => addLinea(mp)}
                        disabled={enPedido}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${enPedido ? 'var(--red)' : 'var(--border)'}`,
                          background: enPedido ? 'var(--c-red-bg)' : 'var(--surface)',
                          cursor: enPedido ? 'default' : 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.1s',
                          textAlign: 'left',
                        }}
                        onMouseEnter={e => { if (!enPedido) e.currentTarget.style.borderColor = 'var(--red)' }}
                        onMouseLeave={e => { if (!enPedido) e.currentTarget.style.borderColor = 'var(--border)' }}
                      >
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '500', color: enPedido ? 'var(--red)' : 'var(--text-1)' }}>{mp.nombre}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>{euro(mp.precio_con_iva)} / {mp.unidad}</p>
                        </div>
                        <span style={{ fontSize: '18px', color: enPedido ? 'var(--red)' : 'var(--border-2)', fontWeight: '300' }}>
                          {enPedido ? '✓' : '+'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Panel derecho — pedido actual */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Pedido actual
              </p>

              {lineas.length === 0 ? (
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>Pulsa + en los productos para añadirlos al pedido.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {lineas.map(linea => (
                    <div key={linea.mp.id} className="card" style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-1)' }}>{linea.mp.nombre}</p>
                        <button
                          onClick={() => removeLinea(linea.mp.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: '16px', lineHeight: 1, padding: '0 4px' }}
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px' }}>
                        <div>
                          <label className="label">Cantidad ({linea.mp.unidad})</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={linea.cantidad}
                            onChange={e => updateLinea(linea.mp.id, 'cantidad', e.target.value)}
                            placeholder="0"
                            className="input"
                            style={{ textAlign: 'center', fontWeight: '700', fontSize: '16px' }}
                          />
                        </div>
                        <div>
                          <label className="label">Observación</label>
                          <input
                            type="text"
                            value={linea.observacion}
                            onChange={e => updateLinea(linea.mp.id, 'observacion', e.target.value)}
                            placeholder="Urgente, formato especial..."
                            className="input"
                          />
                        </div>
                      </div>
                      {linea.cantidad && parseFloat(linea.cantidad) > 0 && (
                        <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '6px', textAlign: 'right' }}>
                          ≈ {euro(parseFloat(linea.cantidad) * linea.mp.precio_con_iva)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Opciones adicionales */}
              {lineas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label className="label">Fecha de entrega (opcional)</label>
                    <input
                      type="text"
                      value={fechaEntrega}
                      onChange={e => setFechaEntrega(e.target.value)}
                      placeholder="Ej: Lunes 23 de junio"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Nota general (opcional)</label>
                    <textarea
                      value={notaGeneral}
                      onChange={e => setNotaGeneral(e.target.value)}
                      placeholder="Observaciones generales del pedido..."
                      className="input"
                      rows={2}
                      style={{ resize: 'none' }}
                    />
                  </div>

                  {totalEstimado > 0 && (
                    <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Total estimado</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-1)' }}>{euro(totalEstimado)}</span>
                    </div>
                  )}

                  {/* Previsualización del mensaje */}
                  {lineasConCantidad.length > 0 && (
                    <div style={{ background: '#ECF8F1', border: '1px solid #A3E4C1', borderRadius: '8px', padding: '12px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--green)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Vista previa del mensaje
                      </p>
                      <pre style={{ fontSize: '12px', color: 'var(--text-2)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>
                        {generarMensaje()}
                      </pre>
                    </div>
                  )}

                  {/* Botones de envío */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {selectedProv.telefono && (
                      <button
                        onClick={abrirWhatsApp}
                        disabled={lineasConCantidad.length === 0}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: lineasConCantidad.length > 0 ? '#25D366' : 'var(--border)',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '700',
                          cursor: lineasConCantidad.length > 0 ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Enviar por WhatsApp
                      </button>
                    )}
                    <button
                      onClick={copiarMensaje}
                      disabled={lineasConCantidad.length === 0}
                      className="btn btn-secondary"
                      style={{ padding: '12px 16px' }}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
