import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-asignatura',
  standalone: false,
  templateUrl: './asignatura.html',
  styleUrl: './asignatura.scss'
})
export class Asignatura implements OnInit {
  
  nombreAsignatura: string = '';
  listaArchivos: any[] = [];
  mostrarSubida: boolean = false;
  nuevoMensajeForo: string = '';

  comentariosForo: any[] = [
    { 
      usuario: 'Pato_DAM', 
      texto: '¿Alguien tiene el PDF de la intro?', 
      fecha: '12:30',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pato' 
    },
    { 
      usuario: 'Admin', 
      texto: 'Ya está verificado en la lista.', 
      fecha: '12:45',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.nombreAsignatura = this.route.snapshot.paramMap.get('nombre') || 'Asignatura';
    this.cargarArchivosPorAsignatura();
  }

  // --- NAVEGACIÓN ---
  volver() { 
    this.router.navigate(['/home']); 
  }

  toggleUpload() {
    this.mostrarSubida = !this.mostrarSubida;
  }

  // --- LÓGICA DE APUNTES ---
  cargarArchivosPorAsignatura() {
    this.listaArchivos = [
      { 
        nombre: 'Introduccion_XML.pdf', 
        autor: 'Pato', 
        fecha: '22/01/2026', 
        verificado: true, 
        portadaUrl: 'https://edit.org/photos/img/blog/p95-plantillas-portadas-libros-revistas-editables-gratis.jpg',
        comentarioAutor: 'Estos son los apuntes de la primera semana. He incluido los esquemas que el profesor dijo que eran más importantes para el examen final.',
        comentariosDestacados: [
          { usuario: 'Juan', texto: 'Buenísimos estos apuntes.' },
          { usuario: 'Maria', texto: 'Me han salvado el examen.' }
        ],
        nuevoComentario: '' // Campo temporal para el input de cada PDF
      }
    ];
  }

  descargarArchivo(archivo: any) {
    console.log('Solicitando descarga a Spring Boot de:', archivo.nombre);
    // Simulación de delay de red
    const toast = alert(`Iniciando descarga de ${archivo.nombre}...`);
  }

  onFileSelected(event: any) { 
    const file = event.target.files[0];
    if (file) {
      console.log('Iniciando subida de:', file.name);
      // Simulación de proceso de subida
      setTimeout(() => {
        this.mostrarSubida = false;
        alert(`¡${file.name} subido correctamente! Pendiente de verificación.`);
      }, 800);
    }
  }

  // Enviar comentario específico a un PDF
  enviarComentarioArchivo(archivo: any) {
    if (archivo.nuevoComentario.trim()) {
      archivo.comentariosDestacados.push({
        usuario: 'Tú',
        texto: archivo.nuevoComentario
      });
      archivo.nuevoComentario = ''; // Limpiar input
    }
  }

  // --- LÓGICA DEL FORO ---
  enviarMensajeForo() {
    if (this.nuevoMensajeForo.trim()) {
      this.comentariosForo.push({
        usuario: 'Tú',
        texto: this.nuevoMensajeForo,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TuUser'
      });
      this.nuevoMensajeForo = '';
      
      this.scrollChatAlFinal();
    }
  }

  private scrollChatAlFinal() {
    setTimeout(() => {
      const chatBox = document.querySelector('.chat-scroll');
      if (chatBox) {
        chatBox.scrollTo({
          top: chatBox.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  }
}