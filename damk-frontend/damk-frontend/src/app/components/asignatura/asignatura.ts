import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';
import { ApuntesService } from '../../services/apuntes';
import { Subscription } from 'rxjs';

interface ApunteDB {
  id: number;
  titulo: string;
  asignatura: string;
  curso: string;
  urlCloudinary: string;
  estado: string;
  fechaSubida: string;
  autor?: { nombre: string };
}

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

@Component({
  selector: 'app-asignatura',
  standalone: false,
  templateUrl: './asignatura.html',
  styleUrl: './asignatura.scss'
})
export class Asignatura implements OnInit, OnDestroy {
  public nombreAsignatura: string = '';
  public cursoActual: string = '1º'; 
  public listaArchivos: any[] = [];
  public nuevoMensajeForo: string = '';
  public archivoSeleccionado: any = null;
  public urlPrevisualizacion: SafeResourceUrl | null = null;
  private subscripcionApuntes: Subscription | null = null;

  // --- NUEVAS VARIABLES PARA EL FORMULARIO DE SUBIDA ---
  public modalSubidaAbierto: boolean = false;
  public datosSubida = {
    archivo: null as File | null,
    titulo: '',
    comentario: ''
  };

  public comentariosForo: any[] = [
    { usuario: 'Pato_DAM', texto: '¿Alguien tiene el PDF de la intro?', fecha: '12:30', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pato' },
    { usuario: 'Admin', texto: 'Ya está verificado en la lista.', fecha: '12:45', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' }
  ];

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private sanitizer: DomSanitizer,
    private apuntesService: ApuntesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.nombreAsignatura = this.route.snapshot.paramMap.get('nombre') || 'Asignatura';
    
    const nombresSegundo = [
      'Acceso a Datos',
      'Programación de Servicios y Procesos',
      'Programación multimedia y dispositivos móviles',
      'Desarrollo de Interfaces',
      'Digitalización',
      'Sistemas de gestión empresarial'
    ];
    this.cursoActual = nombresSegundo.includes(this.nombreAsignatura) ? '2º' : '1º';

    this.cargarDatosDesdeBackend();
  }

  public cargarDatosDesdeBackend(): void {
    if (this.subscripcionApuntes) {
      this.subscripcionApuntes.unsubscribe();
    }

    this.subscripcionApuntes = this.apuntesService.getApuntesPorAsignatura(this.nombreAsignatura).subscribe({
      next: (data: ApunteDB[]) => { 
        this.listaArchivos = data.map((apunte: ApunteDB) => {
          const urlSegura = apunte.urlCloudinary.replace('http:', 'https:');
          return {
            id: apunte.id,
            nombre: apunte.titulo,
            autor: apunte.autor ? apunte.autor.nombre : 'Usuario DAMK', 
            fecha: new Date(apunte.fechaSubida).toLocaleDateString(),
            verificado: apunte.estado === 'VERIFICADO',
            urlReal: urlSegura, 
            portadaUrl: 'https://placehold.co/400x500/1e293b/ffffff?text=Cargando+PDF...', 
            comentarioAutor: 'Material educativo verificado.',
            comentariosDestacados: [],
            nuevoComentario: ''
          };
        });
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.listaArchivos.forEach(archivo => this.generarPortadaReal(archivo));
      },
      error: (err: any) => console.error("[SISTEMA] Error API:", err)
    });
  }

  /**
   * PASO 1: Captura el archivo y abre el modal de detalles.
   */
  public onFileSelected(event: any): void { 
    const file = event.target.files[0];
    if (file) {
      this.datosSubida.archivo = file;
      // Limpiamos la extensión para el título por defecto
      this.datosSubida.titulo = file.name.replace(/\.[^/.]+$/, "");
      this.datosSubida.comentario = '';
      this.modalSubidaAbierto = true;
      this.cdr.detectChanges();
    }
  }

  /**
   * PASO 2: Confirmación final con los datos del formulario.
   */
  public confirmarSubida(): void {
    if (!this.datosSubida.archivo || !this.datosSubida.titulo) return;

    const nombresSegundo = [
      'Acceso a Datos',
      'Programación de Servicios y Procesos',
      'Programación multimedia y dispositivos móviles',
      'Desarrollo de Interfaces',
      'Digitalización',
      'Sistemas de gestión empresarial'
    ];
    const cursoAsignado = nombresSegundo.includes(this.nombreAsignatura) ? "Segundo" : "Primero";

    this.apuntesService.subirApunte(
      this.datosSubida.archivo, 
      this.datosSubida.titulo, 
      this.nombreAsignatura, 
      cursoAsignado, 
      1
    ).subscribe({
      next: (res: any) => {
        this.cargarDatosDesdeBackend();
        this.cancelarSubida();
        alert(`¡Apunte "${this.datosSubida.titulo}" subido correctamente!`);
      },
      error: (err: any) => console.error("[ERROR] Subida fallida:", err)
    });
  }

  public cancelarSubida(): void {
    this.modalSubidaAbierto = false;
    this.datosSubida = { archivo: null, titulo: '', comentario: '' };
    this.cdr.detectChanges();
  }

  public async generarPortadaReal(archivo: any): Promise<void> {
    try {
      const loadingTask = pdfjsLib.getDocument({ url: archivo.urlReal, withCredentials: false });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error("Contexto no disponible");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport: viewport, canvas: canvas }).promise;
      archivo.portadaUrl = canvas.toDataURL('image/png');
      this.cdr.detectChanges();
    } catch (error) {
      archivo.portadaUrl = 'https://placehold.co/400x500/334155/ffffff?text=PDF';
      this.cdr.detectChanges();
    }
  }

  public abrirPrevisualizacion(archivo: any): void {
    const urlGoogleVisor = `https://docs.google.com/viewer?url=${encodeURIComponent(archivo.urlReal)}&embedded=true`;
    this.archivoSeleccionado = archivo;
    this.urlPrevisualizacion = this.sanitizer.bypassSecurityTrustResourceUrl(urlGoogleVisor);
    this.cdr.detectChanges();
  }

  public cerrarPrevisualizacion(): void {
    this.archivoSeleccionado = null;
    this.urlPrevisualizacion = null;
    this.cdr.detectChanges();
  }

  public async descargarArchivo(archivo: any): Promise<void> {
    const nombreFinal = archivo.nombre.toLowerCase().endsWith('.pdf') ? archivo.nombre : `${archivo.nombre}.pdf`;
    try {
      const respuesta = await fetch(archivo.urlReal);
      const binario = await respuesta.blob();
      const urlLocal = window.URL.createObjectURL(binario);
      const link = document.createElement('a');
      link.href = urlLocal; link.download = nombreFinal;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); window.URL.revokeObjectURL(urlLocal);
    } catch (error) {
      window.open(archivo.urlReal, '_blank');
    }
  }

  public volver(): void { this.router.navigate(['/home']); }

  public enviarMensajeForo(): void {
    if (this.nuevoMensajeForo.trim()) {
      this.comentariosForo.push({
        usuario: 'Tú', texto: this.nuevoMensajeForo,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TuUser'
      });
      this.nuevoMensajeForo = ''; this.cdr.detectChanges();
    }
  }

  public enviarComentarioArchivo(archivo: any): void {
    if (archivo.nuevoComentario && archivo.nuevoComentario.trim()) {
      archivo.comentariosDestacados.push({ usuario: 'Tú', texto: archivo.nuevoComentario });
      archivo.nuevoComentario = ''; this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    if (this.subscripcionApuntes) { this.subscripcionApuntes.unsubscribe(); }
  }
}