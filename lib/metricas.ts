import { Producto, MetricasProducto } from '@/types'

export function calcularMetricas(producto: Producto): MetricasProducto {
  const IVA_VENTA = 0.10

  // 1. Coste materias primas (sin IVA)
  const coste_materias_primas = (producto.ingredientes || []).reduce((total, ing) => {
    if (!ing.materia_prima) return total
    const precioPorUnidad = ing.materia_prima.precio_sin_iva
    return total + (precioPorUnidad * ing.cantidad)
  }, 0)

  // 2. Coste packaging por tipo de servicio
  const allPackagings = producto.packagings || []
  
  const coste_packaging_local = allPackagings
    .filter(p => p.tipo_servicio === 'local' || p.tipo_servicio === 'ambos')
    .reduce((total, p) => {
      if (!p.packaging) return total
      return total + (p.packaging.coste_unitario * p.cantidad)
    }, 0)

  const coste_packaging_llevar = allPackagings
    .filter(p => p.tipo_servicio === 'llevar' || p.tipo_servicio === 'ambos')
    .reduce((total, p) => {
      if (!p.packaging) return total
      return total + (p.packaging.coste_unitario * p.cantidad)
    }, 0)

  // 3. Coste operativo (merma aplicada sobre MP + mano obra + energía + otros)
  const factor_merma = 1 + (producto.merma_porcentaje / 100)
  const coste_mp_con_merma = coste_materias_primas * factor_merma
  const extra_merma = coste_mp_con_merma - coste_materias_primas
  
  const coste_operativo = extra_merma + producto.coste_mano_obra + producto.coste_energia + producto.coste_otros_operativos

  // 4. Costes totales
  const coste_total_local = coste_materias_primas + coste_packaging_local + coste_operativo
  const coste_total_llevar = coste_materias_primas + coste_packaging_llevar + coste_operativo

  // 5. PVP
  const pvp_con_iva = producto.pvp_con_iva
  const pvp_sin_iva = pvp_con_iva / (1 + IVA_VENTA)

  // 6. Beneficio bruto
  const beneficio_bruto_local = pvp_sin_iva - coste_total_local
  const beneficio_bruto_llevar = pvp_sin_iva - coste_total_llevar

  // 7. Márgenes
  const margen_local = pvp_sin_iva > 0 ? (beneficio_bruto_local / pvp_sin_iva) * 100 : 0
  const margen_llevar = pvp_sin_iva > 0 ? (beneficio_bruto_llevar / pvp_sin_iva) * 100 : 0

  // 8. Food cost
  const food_cost = pvp_sin_iva > 0 ? (coste_materias_primas / pvp_sin_iva) * 100 : 0
  const food_cost_total_local = pvp_sin_iva > 0 ? (coste_total_local / pvp_sin_iva) * 100 : 0
  const food_cost_total_llevar = pvp_sin_iva > 0 ? (coste_total_llevar / pvp_sin_iva) * 100 : 0

  return {
    coste_materias_primas,
    coste_packaging_local,
    coste_packaging_llevar,
    coste_operativo,
    coste_total_local,
    coste_total_llevar,
    pvp_sin_iva,
    pvp_con_iva,
    beneficio_bruto_local,
    beneficio_bruto_llevar,
    margen_local,
    margen_llevar,
    food_cost,
    food_cost_total_local,
    food_cost_total_llevar,
  }
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value)
}

export function formatEuro2(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPorcentaje(value: number): string {
  return `${value.toFixed(2)}%`
}

export const CATEGORIAS = [
  { value: 'churros', label: 'Churros', emoji: '🍩' },
  { value: 'combos', label: 'Combos', emoji: '🎁' },
  { value: 'canelitos', label: 'Canelitos', emoji: '🌀' },
  { value: 'bebidas', label: 'Bebidas', emoji: '☕' },
  { value: 'fusion', label: 'Fusión', emoji: '✨' },
  { value: 'otros', label: 'Otros', emoji: '🛍️' },
] as const

export const UNIDADES = [
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'g', label: 'Gramo (g)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'cl', label: 'Centilitro (cl)' },
  { value: 'ud', label: 'Unidad (ud)' },
] as const

export const IVA_COMPRA_OPTIONS = [4, 10, 21] as const
