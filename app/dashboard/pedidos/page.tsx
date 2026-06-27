'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Proveedor { id: string; nombre: string; telefono?: string; notas?: string }
interface ProductoPedido { id: string; codigo?: string; nombre: string; formato: string; unidad_pedido: string; precio_unidad: number; iva: number }
interface LineaPedido { producto: ProductoPedido; cantidad: number; observacion: string }

const CATALOGOS: Record<string, ProductoPedido[]> = {
  'Cash Galicia': [
    { id: 'cg1', codigo: '02157', nombre: 'Harina Haribosa Candeal 1kg', formato: 'Atado x 10 kg', unidad_pedido: 'atados', precio_unidad: 7.42, iva: 4 },
    { id: 'cg2', codigo: '21475', nombre: 'Leche Semidesnatada S/Lactosa 1L', formato: 'Atado x 6 bricks', unidad_pedido: 'atados', precio_unidad: 5.34, iva: 4 },
    { id: 'cg3', codigo: '21093', nombre: 'Leche Celta Hostelería 1,5L', formato: 'Atado x 6 botellas', unidad_pedido: 'atados', precio_unidad: 8.34, iva: 4 },
    { id: 'cg4', codigo: '02453884', nombre: 'Azúcar Azucarera Paquete 1kg', formato: 'Caja x 10 kg', unidad_pedido: 'cajas', precio_unidad: 8.70, iva: 10 },
    { id: 'cg5', codigo: '12045', nombre: 'Azúcar Tubito DHG (1000 sobres)', formato: 'Caja x 1000 sobres', unidad_pedido: 'cajas', precio_unidad: 16.96, iva: 10 },
    { id: 'cg6', codigo: '14013', nombre: 'Canela Molida DHG 600g', formato: 'Bote x 600g', unidad_pedido: 'botes', precio_unidad: 4.94, iva: 10 },
    { id: 'cg7', codigo: '16902389', nombre: 'Agua Cabreiroá 500ml', formato: 'Caja x 8 botellas', unidad_pedido: 'cajas', precio_unidad: 3.04, iva: 10 },
    { id: 'cg8', codigo: '07811-02', nombre: 'Agua Mondariz 500ml', formato: 'Caja x 35 botellas', unidad_pedido: 'cajas', precio_unidad: 9.80, iva: 10 },
    { id: 'cg9', codigo: '05846', nombre: 'Coca-Cola 33cl', formato: 'Atado x 24 latas', unidad_pedido: 'atados', precio_unidad: 14.16, iva: 21 },
    { id: 'cg10', codigo: '11368', nombre: 'Coca-Cola Zero 33cl', formato: 'Atado x 24 latas', unidad_pedido: 'atados', precio_unidad: 14.16, iva: 21 },
    { id: 'cg11', codigo: '06108', nombre: 'Aquarius Limón 33cl', formato: 'Atado x 24 latas', unidad_pedido: 'atados', precio_unidad: 16.08, iva: 21 },
    { id: 'cg12', codigo: '21664', nombre: 'Nestea Limón 33cl', formato: 'Atado x 24 latas', unidad_pedido: 'atados', precio_unidad: 15.36, iva: 21 },
    { id: 'cg13', codigo: '05985-01', nombre: 'Té Hornimans Rooibos', formato: 'Caja x 20 filtros', unidad_pedido: 'cajas', precio_unidad: 2.35, iva: 10 },
    { id: 'cg14', codigo: '25086224', nombre: 'Queso Crema Chesson 500g', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 15.81, iva: 4 },
    { id: 'cg15', codigo: '11123', nombre: 'Lejía Sarmiento 2L', formato: 'Botella', unidad_pedido: 'uds', precio_unidad: 0.99, iva: 21 },
    { id: 'cg16', codigo: '10554', nombre: 'Vajillas Anjara Máquina 6kg', formato: 'Garrafa', unidad_pedido: 'uds', precio_unidad: 9.45, iva: 21 },
    { id: 'cg17', codigo: '19281', nombre: 'Paletina madera BIO enfundada', formato: 'Caja x 500 uds', unidad_pedido: 'cajas', precio_unidad: 4.95, iva: 21 },
    { id: 'cg18', codigo: '20736', nombre: 'Servilleta Levian 20x20 2H', formato: 'Paquete x 100 uds', unidad_pedido: 'paquetes', precio_unidad: 0.59, iva: 21 },
    { id: 'cg19', codigo: '05635-01', nombre: 'Tenedor Nupik Transparente', formato: 'Bolsa x 20 uds', unidad_pedido: 'bolsas', precio_unidad: 0.69, iva: 21 },
    { id: 'cg20', codigo: '07911-04', nombre: 'Cucharilla Café Nupik', formato: 'Bolsa x 30 uds', unidad_pedido: 'bolsas', precio_unidad: 0.69, iva: 21 },
    { id: 'cg21', codigo: '19458', nombre: 'Bolsa camiseta blanca 30x40', formato: 'Paquete x 100 uds', unidad_pedido: 'paquetes', precio_unidad: 3.83, iva: 21 },
    { id: 'cg22', codigo: '19461-01', nombre: 'Bolsa camiseta negra 35x50', formato: 'Paquete x 100 uds', unidad_pedido: 'paquetes', precio_unidad: 4.48, iva: 21 },
    { id: 'cg23', codigo: '21839-01', nombre: 'Portavasos Cartón 2x2', formato: 'Paquete x 50 uds', unidad_pedido: 'paquetes', precio_unidad: 6.95, iva: 21 },
    { id: 'cg24', codigo: '20422-01', nombre: 'Bandeja Nube Lisa 19,8x24,7', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 4.75, iva: 21 },
  ],
  'Cash Record (Mercash)': [
    { id: 'cr1', codigo: '23332406', nombre: 'Aceite Girasol Alto Oleico 10L', formato: 'Garrafa x 10L', unidad_pedido: 'garrafas', precio_unidad: 18.80, iva: 10 },
    { id: 'cr2', codigo: '04536934', nombre: 'Harina Tejedor 1kg', formato: 'Atado x 12 uds', unidad_pedido: 'atados', precio_unidad: 10.20, iva: 4 },
    { id: 'cr3', codigo: '20153292', nombre: 'Harina de Fuerza Eroski 1kg', formato: 'Caja x 10 uds', unidad_pedido: 'cajas', precio_unidad: 8.90, iva: 4 },
    { id: 'cr4', codigo: '00671370', nombre: 'Leche Leyma Semi Brik 1L', formato: 'Atado x 6 uds', unidad_pedido: 'atados', precio_unidad: 5.82, iva: 4 },
    { id: 'cr5', codigo: '10834661', nombre: 'Leche S/Lactosa Kaiku 1L', formato: 'Atado x 6 uds', unidad_pedido: 'atados', precio_unidad: 5.94, iva: 4 },
    { id: 'cr6', codigo: '14879274', nombre: 'Leche Sin Lactosa Eroski 1L', formato: 'Atado x 6 uds', unidad_pedido: 'atados', precio_unidad: 5.52, iva: 4 },
    { id: 'cr7', codigo: '14897060', nombre: 'Leche Entera Servihost 1,5L', formato: 'Atado x 6 uds', unidad_pedido: 'atados', precio_unidad: 8.22, iva: 4 },
    { id: 'cr8', codigo: '25086224', nombre: 'Queso Crema Profesional Chesson 500g', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 15.03, iva: 4 },
    { id: 'cr9', codigo: '25086232', nombre: 'Queso Crema Original Chesson 500g', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 14.95, iva: 4 },
    { id: 'cr10', codigo: '26989723', nombre: 'Mantequilla S/Sal Vaquera 1kg', formato: 'Unidad x 1kg', unidad_pedido: 'uds', precio_unidad: 9.75, iva: 10 },
    { id: 'cr11', codigo: '02453884', nombre: 'Azucar Azucarera Paquete 1kg', formato: 'Caja x 10 uds', unidad_pedido: 'cajas', precio_unidad: 8.00, iva: 10 },
    { id: 'cr12', codigo: '18504621', nombre: 'Azucar Glace Seda 500g', formato: 'Caja x 8 uds', unidad_pedido: 'cajas', precio_unidad: 17.44, iva: 10 },
    { id: 'cr13', codigo: '21772058', nombre: 'Azucarito Moreno 6g (300 sobres)', formato: 'Caja x 300 sobres', unidad_pedido: 'cajas', precio_unidad: 1.20, iva: 10 },
    { id: 'cr14', codigo: '26755330', nombre: 'Azucar Moreno Acor 1kg', formato: 'Caja x 9 uds', unidad_pedido: 'cajas', precio_unidad: 15.66, iva: 10 },
    { id: 'cr15', codigo: '27032960', nombre: 'Cola Cao Sobres 16g (500 sobres)', formato: 'Caja x 500 sobres', unidad_pedido: 'cajas', precio_unidad: 15.17, iva: 10 },
    { id: 'cr16', codigo: '23495682', nombre: 'Nocilla Original 2kg', formato: 'Unidad x 2kg', unidad_pedido: 'uds', precio_unidad: 13.15, iva: 10 },
    { id: 'cr17', codigo: '17640137', nombre: 'Fresa 500g', formato: 'Unidad x 500g', unidad_pedido: 'uds', precio_unidad: 3.60, iva: 4 },
    { id: 'cr18', codigo: '23332794', nombre: 'Coco Rallado Nogal 1kg', formato: 'Unidad x 1kg', unidad_pedido: 'uds', precio_unidad: 6.95, iva: 4 },
    { id: 'cr19', codigo: '00917323', nombre: 'Sal Marina Gruesa Basic 1kg', formato: 'Caja x 8 uds', unidad_pedido: 'cajas', precio_unidad: 2.64, iva: 10 },
    { id: 'cr20', codigo: '16902389', nombre: 'Agua Cabreiroa 500ml', formato: 'Caja x 8 botellas', unidad_pedido: 'cajas', precio_unidad: 2.96, iva: 10 },
  ],

  'Fumisan': [
    { id: 'fm1', codigo: '1.GVPET8OZ', nombre: 'Vaso rPET 8oz/250ml', formato: 'Paquete x 50 uds', unidad_pedido: 'paquetes', precio_unidad: 2.92, iva: 21 },
    { id: 'fm2', codigo: '1.GTPETCUPH', nombre: 'Tapa Cupula con Agujero 95mm', formato: 'Paquete x 50 uds', unidad_pedido: 'paquetes', precio_unidad: 1.57, iva: 21 },
    { id: 'fm3', codigo: '1.VAPACA000080', nombre: 'Vaso 240cc Carton Blanco', formato: 'Paquete x 50 uds', unidad_pedido: 'paquetes', precio_unidad: 2.00, iva: 21 },
    { id: 'fm4', codigo: '1.TAVAPA000042', nombre: 'Tapa Anti-Derrame 240cc Negra', formato: 'Paquete x 100 uds', unidad_pedido: 'paquetes', precio_unidad: 3.62, iva: 21 },
    { id: 'fm5', codigo: '1.TAVAPA000041', nombre: 'Tapa Anti-Derrame 240cc Blanca', formato: 'Paquete x 100 uds', unidad_pedido: 'paquetes', precio_unidad: 3.62, iva: 21 },
    { id: 'fm6', codigo: '1.TAVAPE000032', nombre: 'Tapa rPET 350cc Cupula', formato: 'Paquete x 50 uds', unidad_pedido: 'paquetes', precio_unidad: 1.77, iva: 21 },
    { id: 'fm7', codigo: '1.VAPACA000078', nombre: 'Vaso 120cc 4oz Carton', formato: 'Paquete x 50 uds', unidad_pedido: 'paquetes', precio_unidad: 1.26, iva: 21 },
    { id: 'fm8', codigo: '1.TAVAPA000016', nombre: 'Tapa Vaso Carton 120cc', formato: 'Paquete x 100 uds', unidad_pedido: 'paquetes', precio_unidad: 2.27, iva: 21 },
    { id: 'fm9', codigo: '1.BOPETR000009', nombre: 'Botella PET 500ml c/Tapon', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 0.46, iva: 21 },
    { id: 'fm10', codigo: '1.BOPETR000010', nombre: 'Botella PET 1000ml c/Tapon', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 0.56, iva: 21 },
    { id: 'fm11', codigo: '1.BA1515', nombre: 'Bolsa Papel Antigrasa 15x15cm', formato: 'Caja x 3000 uds', unidad_pedido: 'cajas', precio_unidad: 37.41, iva: 21 },
    { id: 'fm12', codigo: '1.PRP924', nombre: 'Palillo Pincho Madera 10cm', formato: 'Paquete x 100 uds', unidad_pedido: 'paquetes', precio_unidad: 0.41, iva: 21 },
    { id: 'fm13', codigo: '1.ZZ630', nombre: 'Servilleta 20x20 2 Capas', formato: 'Caja x 2400 uds', unidad_pedido: 'cajas', precio_unidad: 21.34, iva: 21 },
    { id: 'fm14', codigo: '1.SE378', nombre: 'Servilleta Interplegada Smartply', formato: 'Caja x 8000 uds', unidad_pedido: 'cajas', precio_unidad: 28.56, iva: 21 },
    { id: 'fm15', codigo: '1.KN0100PB', nombre: 'Servilletero con Porta Carta', formato: 'Unidad', unidad_pedido: 'uds', precio_unidad: 10.65, iva: 21 },
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
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
