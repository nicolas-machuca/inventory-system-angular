// src/app/features/inventario/components/inventario-lista/inventario-lista.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { InventarioService } from '../../services/inventario.service';
import { ProductoInventario } from '../../models/producto.model';
import { CategoriaProducto, Ubicacion } from '../../models/tipos.model';

// Importamos módulos de PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ChipModule } from 'primeng/chip';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inventario-lista',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    ChipModule,
    FormsModule
  ],
  templateUrl: './inventario-lista.component.html',
  styleUrls: ['./inventario-lista.component.css']
})
export class InventarioListaComponent implements OnInit {
  private inventarioService = inject(InventarioService);

  productos: ProductoInventario[] = [];
  filtroCategoria: string = '';
  filtroUbicacion: string = '';
  busqueda: string = '';

  // Opciones para dropdowns
  categoriasOptions: any[] = [];
  ubicacionesOptions: any[] = [];

  // Enums para el template
  readonly categorias = Object.values(CategoriaProducto);
  readonly ubicaciones = Object.values(Ubicacion);

  ngOnInit(): void {
    // Obtén los productos del servicio (datos de prueba)
    this.productos = this.inventarioService.inventario();
    console.log('Productos cargados:', this.productos);
    this.categoriasOptions = this.categorias.map(cat => ({ label: cat, value: cat }));
    this.ubicacionesOptions = this.ubicaciones.map(ub => ({ label: ub, value: ub }));
  }

  productosFiltrados(): ProductoInventario[] {
    return this.productos.filter(producto => {
      const cumpleFiltroCategoria = !this.filtroCategoria || producto.categoria === this.filtroCategoria;
      const cumpleFiltroUbicacion = !this.filtroUbicacion || producto.ubicacion === this.filtroUbicacion;
      const cumpleBusqueda = !this.busqueda ||
        producto.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        producto.codigo.toLowerCase().includes(this.busqueda.toLowerCase());
      return cumpleFiltroCategoria && cumpleFiltroUbicacion && cumpleBusqueda;
    });
  }

  chipClass(ubicacion: string): string {
    if (ubicacion === Ubicacion.SALA_PROCESOS) {
      return 'p-chip-info';
    } else if (ubicacion === Ubicacion.CAMARA_CONGELADOS) {
      return 'p-chip-warning';
    } else if (ubicacion === Ubicacion.LOCAL_MINORISTA) {
      return 'p-chip-success';
    }
    return '';
  }

  eliminarProducto(codigo: string): void {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.productos = this.productos.filter(p => p.codigo !== codigo);
    }
  }
}
