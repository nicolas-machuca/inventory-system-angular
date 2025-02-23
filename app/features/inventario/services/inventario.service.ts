// src/app/features/inventario/services/inventario.service.ts
import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ProductoInventario,
  MovimientoInventario,
  AlertaInventario,
  TipoMovimiento,
  TipoAlerta,
  Ubicacion,
  CategoriaProducto,
  UnidadMedida
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private inventarioState = signal<ProductoInventario[]>([]);
  private movimientosState = signal<MovimientoInventario[]>([]);
  private alertasState = signal<AlertaInventario[]>([]);

  // Computed values
  readonly inventario = computed(() => this.inventarioState());
  readonly movimientos = computed(() => this.movimientosState());
  readonly alertas = computed(() => this.alertasState());

  constructor(private http: HttpClient) {
    this.cargarDatosIniciales();
  }

  private async cargarDatosIniciales() {
    // Datos de prueba para el listado
    this.inventarioState.set([
      {
        codigo: 'VAC001',
        nombre: 'Bife Ancho',
        descripcion: 'Corte de carne vacuna',
        categoria: CategoriaProducto.CARNE_VACUNO,
        subCategoria: 'BIFE',
        unidadMedida: UnidadMedida.KILO,
        precioCompra: 5000,
        precioVenta: 6500,
        stockMinimo: 10,
        stockActual: 15,
        unidades: 15,
        ubicacion: Ubicacion.CAMARA_CONGELADOS,
        fechaVencimiento: new Date()
      },
      {
        codigo: 'CER001',
        nombre: 'Costilla de Cerdo',
        descripcion: 'Costilla de cerdo fresca',
        categoria: CategoriaProducto.CARNE_CERDO,
        subCategoria: 'COSTILLA',
        unidadMedida: UnidadMedida.KILO,
        precioCompra: 3500,
        precioVenta: 4500,
        stockMinimo: 8,
        stockActual: 5,
        unidades: 5,
        ubicacion: Ubicacion.SALA_PROCESOS,
        fechaVencimiento: new Date()
      },
      {
        codigo: 'EMB001',
        nombre: 'Chorizo Parrillero',
        descripcion: 'Chorizo para parrilla',
        categoria: CategoriaProducto.EMBUTIDOS,
        subCategoria: 'CHORIZO',
        unidadMedida: UnidadMedida.KILO,
        precioCompra: 2500,
        precioVenta: 3500,
        stockMinimo: 15,
        stockActual: 20,
        unidades: 20,
        ubicacion: Ubicacion.LOCAL_MINORISTA,
        fechaVencimiento: new Date()
      }
    ]);
  }

  async obtenerProductoPorCodigo(codigo: string): Promise<ProductoInventario | null> {
    // TODO: Implementar llamada al backend
    return this.inventarioState().find(p => p.codigo === codigo) || null;
  }

  async crearProducto(producto: ProductoInventario): Promise<void> {
    // TODO: Implementar llamada al backend
    this.inventarioState.update(inv => [...inv, producto]);
    await this.verificarAlertasStock(producto.codigo);
  }

  async actualizarProducto(producto: ProductoInventario): Promise<void> {
    // TODO: Implementar llamada al backend
    this.inventarioState.update(inv =>
      inv.map(p => p.codigo === producto.codigo ? producto : p)
    );
    await this.verificarAlertasStock(producto.codigo);
  }

  async eliminarProducto(codigo: string): Promise<void> {
    // TODO: Implementar llamada al backend
    this.inventarioState.update(inv =>
      inv.filter(p => p.codigo !== codigo)
    );
  }

  async registrarMovimiento(movimiento: MovimientoInventario): Promise<void> {
    // TODO: Implementar llamada al backend
    this.movimientosState.update(mov => [...mov, {
      ...movimiento,
      fecha: new Date()
    }]);

    await this.procesarMovimiento(movimiento);
  }

  async obtenerMovimientos(filtros?: {
    fechaDesde?: Date;
    fechaHasta?: Date;
    tipo?: TipoMovimiento;
    ubicacion?: Ubicacion;
  }): Promise<MovimientoInventario[]> {
    let movimientos = this.movimientosState();

    if (filtros?.fechaDesde) {
      movimientos = movimientos.filter(m => m.fecha >= filtros.fechaDesde!);
    }
    if (filtros?.fechaHasta) {
      movimientos = movimientos.filter(m => m.fecha <= filtros.fechaHasta!);
    }
    if (filtros?.tipo) {
      movimientos = movimientos.filter(m => m.tipo === filtros.tipo);
    }
    if (filtros?.ubicacion) {
      movimientos = movimientos.filter(m =>
        m.ubicacionOrigen === filtros.ubicacion ||
        m.ubicacionDestino === filtros.ubicacion
      );
    }

    return movimientos;
  }

  private async procesarMovimiento(movimiento: MovimientoInventario) {
    const producto = await this.obtenerProductoPorCodigo(movimiento.codigoProducto);
    if (!producto) throw new Error('Producto no encontrado');

    switch (movimiento.tipo) {
      case TipoMovimiento.ENTRADA:
        producto.stockActual += movimiento.unidades || 0;
        break;
      case TipoMovimiento.SALIDA:
        producto.stockActual -= movimiento.unidades || 0;
        break;
      case TipoMovimiento.TRASPASO:
        // Actualizamos la ubicación
        producto.ubicacion = movimiento.ubicacionDestino!;
        break;
    }

    await this.actualizarProducto(producto);
    await this.verificarAlertasStock(producto.codigo);
  }

  private async verificarAlertasStock(codigoProducto: string) {
    const producto = await this.obtenerProductoPorCodigo(codigoProducto);
    if (!producto) return;

    if (producto.stockActual <= producto.stockMinimo) {
      const alerta: AlertaInventario = {
        tipo: TipoAlerta.STOCK_BAJO,
        mensaje: `Stock bajo para ${producto.nombre}`,
        codigoProducto: producto.codigo,
        fecha: new Date()
      };

      this.alertasState.update(alerts => [...alerts, alerta]);
    }
  }
}
