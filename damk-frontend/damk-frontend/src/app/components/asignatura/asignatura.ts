import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';

// Configuración del worker necesaria para renderizar el PDF en el navegador
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

@Component({
  selector: 'app-asignatura',
  standalone: false,
  templateUrl: './asignatura.html',
  styleUrl: './asignatura.scss'
})
export class Asignatura implements OnInit {
  nombreAsignatura: string = '';
  listaArchivos: any[] = [];
  nuevoMensajeForo: string = '';
  
  // Control de la ventana emergente de previsualización
  archivoSeleccionado: any = null;
  urlPrevisualizacion: SafeResourceUrl | null = null;

  comentariosForo: any[] = [
    { usuario: 'Pato_DAM', texto: '¿Alguien tiene el PDF de la intro?', fecha: '12:30', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pato' },
    { usuario: 'Admin', texto: 'Ya está verificado en la lista.', fecha: '12:45', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' }
  ];

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.nombreAsignatura = this.route.snapshot.paramMap.get('nombre') || 'Asignatura';
    this.cargarArchivosPorAsignatura();
  }

  cargarArchivosPorAsignatura() {
    // Datos extraídos del documento real [cite: 1, 3, 12, 20]
    this.listaArchivos = [
      { 
        nombre: 'UD3.XMLSchema.pdf', 
        autor: 'Catalina Esteban González', // 
        fecha: '25/10/2023', // 
        verificado: true, 
        urlReal: 'assets/docs/UD3.XMLSchema.pdf',
        portadaUrl: '', 
        comentarioAutor: 'Apuntes sobre UD2: XSD (XML Schema Definition). Define la estructura y validación de documentos XML.', // [cite: 12, 25]
        comentariosDestacados: [
          { usuario: 'Juan', texto: 'Buenísimos estos apuntes.' },
          { usuario: 'Maria', texto: 'Me han salvado el examen.' }
        ],
        nuevoComentario: ''
      }
    ];
    
    // Al cargar, generamos la miniatura de la primera página del PDF real
    this.listaArchivos.forEach(archivo => this.generarPortadaReal(archivo));
  }

  // Genera una imagen a partir de la primera hoja del PDF para usarla como portada
  async generarPortadaReal(archivo: any) {
    try {
      const loadingTask = pdfjsLib.getDocument(archivo.urlReal);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // El objeto 'canvas' es requerido en versiones recientes de pdfjs-dist
      const renderContext = { 
        canvasContext: context, 
        viewport: viewport,
        canvas: canvas 
      };

      await page.render(renderContext).promise;
      archivo.portadaUrl = canvas.toDataURL();
    } catch (error) {
      console.error("Error al generar la portada del PDF:", error);
      archivo.portadaUrl = 'assets/img/default-pdf.png';
    }
  }

  onFileSelected(event: any) { 
    const file = event.target.files[0];
    if (file) {
      console.log('Archivo preparado para subir a Spring Boot:', file.name);
      // Aquí dispararías el servicio de subida real
      alert(`Archivo "${file.name}" listo para ser procesado.`);
    }
  }

  // Métodos para manejar la previsualización (Iframe seguro)
  abrirPrevisualizacion(archivo: any) {
    this.archivoSeleccionado = archivo;
    this.urlPrevisualizacion = this.sanitizer.bypassSecurityTrustResourceUrl(archivo.urlReal);
  }

  cerrarPrevisualizacion() {
    this.archivoSeleccionado = null;
    this.urlPrevisualizacion = null;
  }

  descargarArchivo(archivo: any) {
    const link = document.createElement('a');
    link.href = archivo.urlReal;
    link.download = archivo.nombre;
    link.click();
  }

  volver() { this.router.navigate(['/home']); }

  // Lógica de interacción social
  enviarMensajeForo() {
    if (this.nuevoMensajeForo.trim()) {
      this.comentariosForo.push({
        usuario: 'Tú',
        texto: this.nuevoMensajeForo,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TuUser'
      });
      this.nuevoMensajeForo = '';
    }
  }

  enviarComentarioArchivo(archivo: any) {
    if (archivo.nuevoComentario.trim()) {
      archivo.comentariosDestacados.push({ usuario: 'Tú', texto: archivo.nuevoComentario });
      archivo.nuevoComentario = '';
    }
  }
}