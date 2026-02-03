import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApuntesService } from '../../services/apuntes';

@Component({
  selector: 'app-mis-apuntes',
  standalone: false,
  templateUrl: './mis-apuntes.html',
  styleUrl: './mis-apuntes.scss'
})
export class MisApuntes implements OnInit {
  
  // --- ESTADOS DE INTERFAZ ---
  public tabActiva: 'subidos' | 'guardados' = 'subidos';
  public cargando: boolean = false;
  public buscando: boolean = false;
  
  // --- ALMACENAMIENTO DE DATOS ---
  public listaSubidos: any[] = [];
  public listaGuardados: any[] = [];
  
  // --- LISTAS FILTRADAS (Para la barra de búsqueda interna) ---
  public filtradosSubidos: any[] = [];
  public filtradosGuardados: any[] = [];
  public textoFiltro: string = '';

  constructor(
    private apuntesService: ApuntesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log("[SISTEMA] Inicializando Biblioteca Personal...");
    this.cargarMisAportaciones();
    this.cargarMisFavoritos();
  }

  /**
   * Carga desde el servidor todos los apuntes asociados al usuario logueado.
   * Maneja el estado de carga para mostrar el spinner premium.
   */
  public cargarMisAportaciones(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.apuntesService.getMisSubidos().subscribe({
      next: (data) => {
        console.log("[API] Apuntes recuperados con éxito:", data.length);
        // Mapeamos para asegurar que tenemos todos los campos necesarios
        this.listaSubidos = data.map(item => {
          return {
            ...item,
            fechaFormateada: new Date(item.fechaSubida).toLocaleDateString()
          };
        });
        this.filtradosSubidos = [...this.listaSubidos];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("[BIBLIOTECA] Error crítico al cargar aportaciones:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Recupera los apuntes guardados en el almacenamiento local.
   * Esto permite persistencia rápida sin saturar el servidor.
   */
  public cargarMisFavoritos(): void {
    try {
      const favs = localStorage.getItem('apuntes_guardados');
      if (favs) {
        this.listaGuardados = JSON.parse(favs);
        this.filtradosGuardados = [...this.listaGuardados];
        console.log("[STORAGE] Favoritos sincronizados:", this.listaGuardados.length);
      }
    } catch (e) {
      console.error("[SISTEMA] Error al parsear favoritos del localStorage", e);
      this.listaGuardados = [];
    }
  }

  /**
   * Lógica de filtrado en tiempo real. 
   * Se activa cada vez que el usuario escribe en el buscador de la biblioteca.
   */
  public filtrarContenido(): void {
    const busqueda = this.textoFiltro.toLowerCase().trim();
    
    if (!busqueda) {
      this.filtradosSubidos = [...this.listaSubidos];
      this.filtradosGuardados = [...this.listaGuardados];
    } else {
      this.filtradosSubidos = this.listaSubidos.filter(a => 
        a.titulo.toLowerCase().includes(busqueda) || 
        a.asignatura.toLowerCase().includes(busqueda)
      );
      this.filtradosGuardados = this.listaGuardados.filter(g => 
        g.nombre.toLowerCase().includes(busqueda) || 
        g.asignatura.toLowerCase().includes(busqueda)
      );
    }
    this.cdr.detectChanges();
  }

  /**
   * Cambia entre la vista de aportaciones propias y archivos guardados.
   */
  public cambiarTab(tab: 'subidos' | 'guardados'): void {
    console.log("[UI] Cambiando a pestaña:", tab);
    this.tabActiva = tab;
    // Reseteamos el filtro al cambiar de pestaña para evitar confusión
    this.textoFiltro = '';
    this.filtrarContenido();
    this.cdr.detectChanges();
  }

  /**
   * Navega dinámicamente a la página de la asignatura.
   */
  public irAlApunte(item: any): void {
    console.log("[NAV] Navegando a asignatura:", item.asignatura);
    this.router.navigate(['/asignatura', item.asignatura]);
  }

  /**
   * Abre el archivo original en una pestaña nueva (Cloudinary).
   */
  public verArchivoOriginal(url: string, event: Event): void {
    event.stopPropagation(); // Evitamos que se dispare el click de la tarjeta
    if (url) {
      window.open(url, '_blank');
    }
  }

  /**
   * Simulación de borrado profesional con confirmación.
   */
  public eliminarApunte(id: number, event: Event): void {
    event.stopPropagation();
    const confirmar = confirm("¿Estás seguro de que quieres eliminar este apunte? Esta acción no se puede deshacer.");
    
    if (confirmar) {
      console.log("[SISTEMA] Solicitando borrado de ID:", id);
      // Aquí iría la llamada al servicio: this.apuntesService.delete(id)...
      // Por ahora filtramos localmente para que la UI reaccione
      this.listaSubidos = this.listaSubidos.filter(a => a.id !== id);
      this.filtrarContenido();
      alert("Apunte eliminado de tu biblioteca.");
    }
  }

  public volver(): void {
    this.router.navigate(['/home']);
  }
}