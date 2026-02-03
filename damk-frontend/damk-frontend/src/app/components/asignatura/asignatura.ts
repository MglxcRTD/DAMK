import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';
import { ApuntesService } from '../../services/apuntes';
import { Subscription } from 'rxjs';

/**
 * Interface detallada para el mapeo de datos desde el servidor.
 * No optimizamos: definimos cada campo para asegurar tipado fuerte.
 */
interface ApunteDB {
  id: number;
  titulo: string;
  asignatura: string;
  curso: string;
  urlCloudinary: string;
  estado: string;
  fechaSubida: string;
  autor?: { 
    id: number;
    username: string; 
    avatarUrl?: string;
  };
}

// Configuración obligatoria del worker para el procesamiento de hilos de PDF.js
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

@Component({
  selector: 'app-asignatura',
  standalone: false,
  templateUrl: './asignatura.html',
  styleUrl: './asignatura.scss'
})
export class Asignatura implements OnInit, OnDestroy {
  
  // --- PROPIEDADES DE IDENTIDAD DE LA ASIGNATURA ---
  public nombreAsignatura: string = '';
  public cursoActual: string = '1º'; 
  public listaArchivos: any[] = [];
  
  // --- PROPIEDADES DEL SISTEMA DE CHAT/FORO ---
  public nuevoMensajeForo: string = '';
  public comentariosForo: any[] = [];
  
  // --- PROPIEDADES DE PREVISUALIZACIÓN ---
  public archivoSeleccionado: any = null;
  public urlPrevisualizacion: SafeResourceUrl | null = null;
  
  // --- GESTIÓN DE MEMORIA Y SUBSCRIPCIONES ---
  private subscripcionApuntes: Subscription | null = null;

  // --- DATOS DE SESIÓN ---
  public usuarioLogueado: any = null;

  // --- GESTIÓN DEL FORMULARIO DE SUBIDA (MODAL) ---
  public modalSubidaAbierto: boolean = false;
  public datosSubida = {
    archivo: null as File | null,
    titulo: '',
    comentario: ''
  };

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private sanitizer: DomSanitizer,
    private apuntesService: ApuntesService,
    private cdr: ChangeDetectorRef
  ) {
    console.log("[SISTEMA] Constructor de Asignatura invocado.");
  }

  /**
   * Ciclo de vida inicial: Configura el entorno y recupera la sesión.
   */
  ngOnInit(): void {
    console.log("[SISTEMA] Inicializando vista de asignatura...");
    
    // Captura del parámetro de ruta
    this.nombreAsignatura = this.route.snapshot.paramMap.get('nombre') || 'Asignatura';
    console.log("[CONTEXTO] Asignatura activa:", this.nombreAsignatura);

    // Recuperación de la identidad del usuario desde el almacenamiento persistente
    const userJson = localStorage.getItem('usuario');
    if (userJson) {
      this.usuarioLogueado = JSON.parse(userJson);
      console.log("[SESIÓN] Usuario detectado:", this.usuarioLogueado.username);
    } else {
      console.warn("[SESIÓN] No hay usuario logueado. Algunas funciones estarán limitadas.");
    }

    // Lógica de determinación de curso por mapeo de nombres
    const nombresSegundo = [
      'Acceso a Datos',
      'Programación de Servicios y Procesos',
      'Programación multimedia y dispositivos móviles',
      'Desarrollo de Interfaces',
      'Digitalización',
      'Sistemas de gestión empresarial'
    ];
    
    if (nombresSegundo.includes(this.nombreAsignatura)) {
      this.cursoActual = '2º';
    } else {
      this.cursoActual = '1º';
    }

    // Disparar carga de datos
    this.cargarDatosDesdeBackend();
    this.cargarMensajesForoPersistentes();
  }

  /**
   * CARGA DE DATOS DESDE EL REPOSITORIO:
   * Realiza la llamada al servicio y mapea el modelo de BD al modelo de Vista.
   */
  public cargarDatosDesdeBackend(): void {
    console.log("[API] Solicitando apuntes para:", this.nombreAsignatura);
    
    if (this.subscripcionApuntes) {
      this.subscripcionApuntes.unsubscribe();
    }

    this.subscripcionApuntes = this.apuntesService.getApuntesPorAsignatura(this.nombreAsignatura).subscribe({
      next: (data: ApunteDB[]) => { 
        console.log("[API] Respuesta recibida. Procesando archivos...");
        
        this.listaArchivos = data.map((apunte: ApunteDB) => {
          // Normalización de URL para evitar problemas de Mixed Content (HTTP/HTTPS)
          const urlSegura = apunte.urlCloudinary.replace('http:', 'https:');
          
          return {
            id: apunte.id,
            nombre: apunte.titulo,
            // SOLUCIÓN AUTOR: Mapeamos el username del objeto autor que viene del Backend
            autor: apunte.autor ? apunte.autor.username : 'Usuario DAMK', 
            fecha: new Date(apunte.fechaSubida).toLocaleDateString(),
            verificado: apunte.estado === 'VERIFICADO',
            urlReal: urlSegura, 
            portadaUrl: 'https://placehold.co/400x500/1e293b/ffffff?text=Cargando...', 
            comentarioAutor: 'Material verificado por la comunidad educativa.',
            comentariosDestacados: this.recuperarComentariosLocalesApunte(apunte.id),
            nuevoComentario: ''
          };
        });
        
        this.cdr.detectChanges();
        
        // Iniciamos el proceso de renderizado de portadas una por una
        this.listaArchivos.forEach(archivo => {
          this.generarPortadaReal(archivo);
        });
      },
      error: (err: any) => {
        console.error("[CRÍTICO] Error al conectar con el servicio de apuntes:", err);
      }
    });
  }

  /**
   * LÓGICA DE BIBLIOTECA (MIS APUNTES):
   * Guarda el apunte en el repositorio local del cliente.
   */
  public guardarEnMiBiblioteca(archivo: any): void {
    console.log("[BIBLIOTECA] Guardando archivo en favoritos:", archivo.nombre);
    
    let dbLocal = JSON.parse(localStorage.getItem('apuntes_guardados') || '[]');
    
    const coincidencia = dbLocal.find((item: any) => item.id === archivo.id);
    
    if (!coincidencia) {
      const nuevoFavorito = {
        id: archivo.id,
        nombre: archivo.nombre,
        asignatura: this.nombreAsignatura,
        urlReal: archivo.urlReal,
        autor: archivo.autor,
        fechaOriginal: archivo.fecha,
        timestampGuardado: new Date().toISOString()
      };
      
      dbLocal.push(nuevoFavorito);
      localStorage.setItem('apuntes_guardados', JSON.stringify(dbLocal));
      alert(`"${archivo.nombre}" se ha guardado en tu biblioteca personal.`);
    } else {
      alert("Este documento ya forma parte de tu biblioteca.");
    }
  }

  /**
   * GESTIÓN DEL FORO:
   * Implementa persistencia local basada en el identificador de asignatura.
   */
  public cargarMensajesForoPersistentes(): void {
    const storageKey = `foro_v1_${this.nombreAsignatura.replace(/\s+/g, '_')}`;
    const datos = localStorage.getItem(storageKey);
    
    if (datos) {
      this.comentariosForo = JSON.parse(datos);
    } else {
      this.comentariosForo = [
        { 
          usuario: 'DAMK_SYSTEM', 
          texto: `Bienvenido al canal de ${this.nombreAsignatura}. Comparte tus dudas aquí.`, 
          fecha: '08:00', 
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Base' 
        }
      ];
    }
  }

  public enviarMensajeForo(): void {
    if (this.nuevoMensajeForo.trim().length === 0) return;

    console.log("[FORO] Enviando nuevo mensaje...");

    const mensajeNuevo = {
      usuario: this.usuarioLogueado?.username || 'Anónimo',
      texto: this.nuevoMensajeForo,
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.usuarioLogueado?.username || 'User'}`
    };

    this.comentariosForo.push(mensajeNuevo);
    
    // Sincronización con el storage
    const storageKey = `foro_v1_${this.nombreAsignatura.replace(/\s+/g, '_')}`;
    localStorage.setItem(storageKey, JSON.stringify(this.comentariosForo));

    this.nuevoMensajeForo = '';
    this.cdr.detectChanges();
  }

  /**
   * GESTIÓN DE COMENTARIOS POR ARCHIVO:
   * Permite que los comentarios de un PDF específico se guarden.
   */
  private recuperarComentariosLocalesApunte(apunteId: number): any[] {
    const key = `comments_apunte_${apunteId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  public enviarComentarioArchivo(archivo: any): void {
    if (!archivo.nuevoComentario || archivo.nuevoComentario.trim() === '') return;

    const comentarioData = {
      usuario: this.usuarioLogueado?.username || 'Usuario_DAMK',
      texto: archivo.nuevoComentario,
      fecha: new Date().toISOString()
    };

    archivo.comentariosDestacados.push(comentarioData);
    
    // Persistencia por ID de archivo
    const key = `comments_apunte_${archivo.id}`;
    localStorage.setItem(key, JSON.stringify(archivo.comentariosDestacados));

    archivo.nuevoComentario = '';
    this.cdr.detectChanges();
  }

  /**
   * PROCESAMIENTO DE ARCHIVOS (SUBIDA):
   */
  public onFileSelected(event: any): void { 
    const file = event.target.files[0];
    if (file) {
      console.log("[UPLOAD] Archivo seleccionado:", file.name);
      this.datosSubida.archivo = file;
      this.datosSubida.titulo = file.name.replace(/\.[^/.]+$/, "");
      this.datosSubida.comentario = '';
      this.modalSubidaAbierto = true;
      this.cdr.detectChanges();
    }
  }

  public confirmarSubida(): void {
    if (!this.datosSubida.archivo || !this.datosSubida.titulo) {
      alert("Por favor, completa los datos del archivo.");
      return;
    }

    const cursoRelativo = this.cursoActual === '2º' ? "Segundo" : "Primero";
    const idUsuarioActivo = this.usuarioLogueado?.id || 1;

    console.log("[API] Iniciando proceso de subida a Cloudinary...");

    this.apuntesService.subirApunte(
      this.datosSubida.archivo, 
      this.datosSubida.titulo, 
      this.nombreAsignatura, 
      cursoRelativo, 
      idUsuarioActivo
    ).subscribe({
      next: (respuesta: any) => {
        console.log("[API] Subida completada exitosamente.");
        this.cargarDatosDesdeBackend();
        this.cancelarSubida();
        alert(`El apunte "${this.datosSubida.titulo}" ha sido enviado correctamente.`);
      },
      error: (err: any) => {
        console.error("[API] Error en el flujo de subida:", err);
        alert("Hubo un problema al subir el archivo. Inténtalo de nuevo.");
      }
    });
  }

  public cancelarSubida(): void {
    this.modalSubidaAbierto = false;
    this.datosSubida = { archivo: null, titulo: '', comentario: '' };
    this.cdr.detectChanges();
  }

  /**
   * RENDERIZADO DE PORTADAS (PDF.JS):
   * CORRECCIÓN QUIRÚRGICA: Añadimos 'canvas' al RenderParameters.
   */
  public async generarPortadaReal(archivo: any): Promise<void> {
    try {
      console.log("[PDF.JS] Procesando miniatura para:", archivo.nombre);
      
      const loadingTask = pdfjsLib.getDocument({ 
        url: archivo.urlReal, 
        withCredentials: false 
      });
      
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const scale = 0.5;
      const viewport = page.getViewport({ scale: scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error("No se pudo obtener el contexto 2D del canvas.");
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // DEFINICIÓN DE PARÁMETROS DE RENDERIZADO (CORREGIDO)
      const renderParameters: any = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas // <--- PROPIEDAD REQUERIDA POR LAS NUEVAS VERSIONES
      };

      await page.render(renderParameters).promise;
      
      archivo.portadaUrl = canvas.toDataURL('image/png');
      this.cdr.detectChanges();
      
    } catch (error) {
      console.warn("[PDF.JS] Fallo al generar miniatura. Usando placeholder.");
      archivo.portadaUrl = 'https://placehold.co/400x500/334155/ffffff?text=VER+PDF';
      this.cdr.detectChanges();
    }
  }

  /**
   * PREVISUALIZACIÓN:
   * Abre el visor de Google Drive para documentos pesados.
   */
  public abrirPrevisualizacion(archivo: any): void {
    console.log("[VISOR] Abriendo previsualización de:", archivo.nombre);
    const urlVisor = `https://docs.google.com/viewer?url=${encodeURIComponent(archivo.urlReal)}&embedded=true`;
    this.archivoSeleccionado = archivo;
    this.urlPrevisualizacion = this.sanitizer.bypassSecurityTrustResourceUrl(urlVisor);
    this.cdr.detectChanges();
  }

  public cerrarPrevisualizacion(): void {
    this.archivoSeleccionado = null;
    this.urlPrevisualizacion = null;
    this.cdr.detectChanges();
  }

  /**
   * DESCARGA DIRECTA:
   * Realiza un fetch del binario para forzar la descarga con nombre personalizado.
   */
  public async descargarArchivo(archivo: any): Promise<void> {
    console.log("[SISTEMA] Iniciando descarga de binario...");
    const nombreDescarga = archivo.nombre.toLowerCase().endsWith('.pdf') ? archivo.nombre : `${archivo.nombre}.pdf`;
    
    try {
      const respuesta = await fetch(archivo.urlReal);
      const blob = await respuesta.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.href = urlBlob; 
      anchor.download = nombreDescarga;
      
      document.body.appendChild(anchor); 
      anchor.click();
      
      document.body.removeChild(anchor); 
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error("[SISTEMA] Error en descarga directa. Abriendo en pestaña nueva.");
      window.open(archivo.urlReal, '_blank');
    }
  }

  public volver(): void { 
    this.router.navigate(['/home']); 
  }

  /**
   * Limpieza de subscripciones al destruir el componente.
   */
  ngOnDestroy(): void {
    console.log("[SISTEMA] Destruyendo componente Asignatura...");
    if (this.subscripcionApuntes) {
      this.subscripcionApuntes.unsubscribe();
    }
  }
}