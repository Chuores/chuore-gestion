export type IvaCompra = 4 | 10 | 21
export type IvaVenta = 10
export type UnidadMateriaPrima = 'kg' | 'g' | 'l' | 'ml' | 'cl' | 'ud'
export type TipoPackaging = 'local' | 'llevar' | 'ambos'
export type CategoriaProducto = 'churros' | 'combos' | 'canelitos' | 'bebidas' | 'fusion' | 'otros'

export interface Proveedor {
  id: string; nombre: string; telefono?: string; email?: string; notas?: string
  created_at: string; updated_at: string
}
export interface MateriaPrima {
  id: string; nombre: string; unidad: UnidadMateriaPrima
  precio_sin_iva: number; iva_compra: IvaCompra; precio_con_iva: number
  proveedor_id?: string; proveedor?: Proveedor; created_at: string; updated_at: string
}
export interface Packaging {
  id: string; nombre: string; coste_unitario: number; tipo: TipoPackaging
  descripcion?: string; created_at: string; updated_at: string
}
export interface Producto {
  id: string; nombre: string; categoria: CategoriaProducto; pvp_con_iva: number
  iva_venta: IvaVenta; merma_porcentaje: number; coste_mano_obra: number
  coste_energia: number; coste_otros_operativos: number; activo: boolean; notas?: string
  created_at: string; updated_at: string
  ingredientes?: ProductoIngrediente[]; packagings?: ProductoPackaging[]
}
export interface ProductoIngrediente {
  id: string; producto_id: string; materia_prima_id: string; cantidad: number; materia_prima?: MateriaPrima
}
export interface ProductoPackaging {
  id: string; producto_id: string; packaging_id: string; cantidad: number
  tipo_servicio: TipoPackaging; packaging?: Packaging
}
export interface MetricasProducto {
  coste_materias_primas: number; coste_packaging_local: number; coste_packaging_llevar: number
  coste_operativo: number; coste_total_local: number; coste_total_llevar: number
  pvp_sin_iva: number; pvp_con_iva: number; beneficio_bruto_local: number
  beneficio_bruto_llevar: number; margen_local: number; margen_llevar: number
  food_cost: number; food_cost_total_local: number; food_cost_total_llevar: number
}
export interface Venta {
  id: string; fecha: string; total: number; notas?: string; created_at: string
}
export interface CategoriaGasto {
  id: string; nombre: string; color: string; created_at: string
}
export interface Gasto {
  id: string; fecha: string; concepto: string; importe: number
  categoria_id?: string; proveedor_id?: string; notas?: string; created_at: string
  categoria?: CategoriaGasto; proveedor?: Proveedor
}
