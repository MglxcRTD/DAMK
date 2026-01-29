import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth'; 
import { Chat } from '../../services/chat'; 
import { MensajeDTO } from '../../models/mensaje.dto'; // Importamos la interfaz del DTO

/**
 * Interfaz para gestionar las notificaciones del centro de control
 */
interface Notificacion {
  id: string;
  titulo: string;
  descripcion: string;
  ruta: string;
  icono: string;
  tipo: 'verificacion' | 'sistema' | 'social' | 'amistad'; // Añadido tipo amistad
}

/**
 * Interfaz para la gestión de contactos en el panel de chat
 */
interface Contacto {
  id: number;
  username: string;
  avatar?: string;
  online: boolean;
  ultimoMensaje: string;
  pendientes: number;
  timestamp?: Date; // Añadido para corregir el error NG0100
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  // Referencia al contenedor de mensajes para el scroll automático
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  // --- VARIABLES DE ESTADO DE LA INTERFAZ ---
  sidebarOpen: boolean = true;
  cursoSeleccionado: string = 'PRIMERO'; 
  
  // Gestión de Notificaciones
  notificaciones: Notificacion[] = [];
  mostrarListaNotis: boolean = false;
  pendientesCount: number = 0; 

  // --- VARIABLES PARA EL CHAT FULL STACK ---
  mensajesChat: any[] = []; // Cambiado a any para permitir la propiedad timestamp fija
  nuevoMensaje: string = '';       // Modelo para el input de texto
  mostrarChatFlotante: boolean = false; // Controla si el panel lateral está abierto
  
  // Gestión de contactos y chat activo
  chatActivo: Contacto | null = null;    // Contacto seleccionado actualmente
  contactos: Contacto[] = [];           // Lista de contactos/conversaciones (Amigos aceptados)

  // --- FUNCIONALIDAD DE AMISTAD Y BÚSQUEDA ---
  mostrarModalBusqueda: boolean = false;
  mostrarSolicitudes: boolean = false;   // Controla el dropdown de solicitudes de amistad
  solicitudesPendientes: any[] = [];     // Lista de personas que quieren ser tus amigos
  terminoBusqueda: string = '';
  resultadosBusqueda: any[] = [];        // Usuarios encontrados en la BD
  buscando: boolean = false;

  // --- FUNCIONALIDAD PARA ADMINISTRADORES ---
  usuariosSistema: Contacto[] = [];      // Lista global de todos los usuarios para el Admin
  chatTab: 'chats' | 'usuarios' = 'chats'; // Pestaña activa en el panel lateral Admin

  // Objeto de usuario inicializado para evitar errores de renderizado
  usuarioActivo: any = {
    username: 'Cargando...',
    puntosReputacion: 0,
    avatarUrl: null,
    rol: 'ALUMNO' 
  };

  // Referencia a Date para acceso desde el HTML
  public readonly Date = Date;

  constructor(
    private router: Router, 
    private authService: Auth,
    private chatService: Chat, // Inyectamos el servicio de Chat (WebSocket)
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.cargarDatosReales();
    this.aplicarTemaGuardado();
    console.log("[SISTEMA] Home inicializado correctamente.");
  }

  /**
   * Se ejecuta al destruir el componente para cerrar el túnel de mensajes
   */
  ngOnDestroy() {
    this.chatService.desconectar();
  }

  /**
   * Recupera el usuario y activa la lógica de notificaciones y tiempo real
   */
  cargarDatosReales() {
    const userJson = localStorage.getItem('usuario');
    
    if (userJson) {
      this.usuarioActivo = JSON.parse(userJson);
      this.inicializarServiciosPostLogin();
    } else {
      this.authService.getMe().subscribe({
        next: (user: any) => {
          localStorage.setItem('usuario', JSON.stringify(user));
          this.usuarioActivo = user;
          this.inicializarServiciosPostLogin();
        },
        error: (err: any) => {
          console.error('[AUTH] No existe sesión activa:', err);
          this.router.navigate(['/login']);
        }
      });
    }
  }

  /**
   * Centraliza las acciones que ocurren una vez confirmado el usuario activo
   */
  private inicializarServiciosPostLogin() {
    this.procesarNotificacionesSegunRol();
    
    // Si es ADMIN, cargamos el directorio completo de usuarios registrados
    if (this.usuarioActivo.rol === 'ADMIN') {
      this.cargarDirectorioUsuariosAdmin();
    } else {
      this.obtenerMisAmigosAceptados();
    }
    
    // Conexión al WebSocket para mensajes en tiempo real
    if (this.usuarioActivo?.id) {
      this.chatService.conectar(this.usuarioActivo.id);
      this.escucharMensajesDeSistema();
    }
  }

  /**
   * CARGA DE DATOS PARA ADMIN (Directorio total de la App)
   */
  cargarDirectorioUsuariosAdmin() {
    console.log("[ADMIN] Cargando directorio completo de usuarios registrados...");
    this.authService.getTodosLosUsuarios().subscribe({
      next: (users: any[]) => {
        this.usuariosSistema = users.map(u => ({
          id: u.id,
          username: u.username,
          avatar: u.avatarUrl,
          online: false, 
          ultimoMensaje: 'Usuario del sistema',
          pendientes: 0
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar usuarios:", err)
    });
  }

  /**
   * CARGA DE DATOS PARA ALUMNO (Solo amigos confirmados)
   */
  obtenerMisAmigosAceptados() {
    console.log("[USER] Sincronizando lista de amigos desde la base de datos...");
    // Aquí podrías implementar la carga de amigos si tienes el endpoint listo
  }

  /**
   * Escucha mensajes del WebSocket. 
   */
  escucharMensajesDeSistema() {
    this.chatService.nuevoMensaje$.subscribe((msg: any) => {
      if (msg) {
        // Fijamos la fecha aquí para evitar el error NG0100
        // Ahora el mensaje trae el emisorId desde el backend para posicionar la burbuja
        const mensajeConFecha = { ...msg, timestamp: new Date() };
        this.mensajesChat.push(mensajeConFecha);

        // Notificación visual en la campana
        this.notificaciones.unshift({
          id: `chat-${Date.now()}`,
          titulo: 'Nuevo Mensaje de Chat',
          descripcion: msg.contenido,
          ruta: '/home',
          icono: 'forum',
          tipo: 'social'
        });

        this.pendientesCount = this.notificaciones.length;
        this.scrollToBottom();
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * LÓGICA DE SOLICITUDES DE AMISTAD
   */
  enviarSolicitudAmistad(usuarioDestino: any) {
    console.log("[SOCIAL] Enviando solicitud a: " + usuarioDestino.username);
    this.authService.enviarSolicitudAmistad(this.usuarioActivo.id, usuarioDestino.id).subscribe({
      next: () => {
        this.cerrarModalBusqueda();
        // Feedback visual
        this.notificaciones.unshift({
          id: `social-${Date.now()}`,
          titulo: 'Solicitud Enviada',
          descripcion: `Has enviado una petición a ${usuarioDestino.username}`,
          ruta: '/home',
          icono: 'person_add',
          tipo: 'social'
        });
        this.pendientesCount = this.notificaciones.length;
        this.cdr.detectChanges();
      }
    });
  }

  aceptarAmistad(solicitud: any) {
    console.log("[SOCIAL] Aceptando amistad de: " + solicitud.username);
    // Aquí iría la llamada al backend para cambiar el estado a 'ACEPTADA'
    this.contactos.push({
      id: solicitud.userId,
      username: solicitud.username,
      online: true,
      ultimoMensaje: '¡Ahora sois amigos!',
      pendientes: 0
    });
    this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id !== solicitud.id);
    this.cdr.detectChanges();
  }

  toggleSolicitudes() {
    this.mostrarSolicitudes = !this.mostrarSolicitudes;
  }

  cambiarTabAdmin(tab: 'chats' | 'usuarios') {
    this.chatTab = tab;
  }

  /**
   * LÓGICA DE GESTIÓN DE CONTACTOS Y NAVEGACIÓN DE CHAT
   */
  abrirChatCon(id: number) {
    let contactoEncontrado = this.contactos.find(c => c.id === id);
    
    // Si es ADMIN, buscamos también en la lista global de usuarios
    if (!contactoEncontrado && this.usuarioActivo.rol === 'ADMIN') {
      contactoEncontrado = this.usuariosSistema.find(u => u.id === id);
    }

    if (contactoEncontrado) {
      this.chatActivo = contactoEncontrado;
      this.chatActivo.pendientes = 0; 
    } else if (id === 1) {
      this.chatActivo = { 
        id: 1, 
        username: 'Soporte Técnico', 
        online: true, 
        ultimoMensaje: 'Chat oficial de DAMK', 
        pendientes: 0 
      };
    }
    
    this.scrollToBottom();
  }

  cerrarConversacion() {
    this.chatActivo = null;
  }

  /**
   * FUNCIONALIDAD DE BÚSQUEDA FUNCIONAL
   */
  abrirModalBusqueda() {
    this.mostrarModalBusqueda = true;
    this.resultadosBusqueda = [];
    this.terminoBusqueda = '';
  }

  cerrarModalBusqueda() {
    this.mostrarModalBusqueda = false;
  }

  buscarUsuariosBD() {
    if (this.terminoBusqueda.length < 3) {
      this.resultadosBusqueda = [];
      return;
    }
    
    this.buscando = true;
    console.log("[CHAT] Realizando búsqueda en base de datos para: " + this.terminoBusqueda);
    
    this.authService.buscarUsuarios(this.terminoBusqueda).subscribe({
      next: (usuarios: any[]) => {
        // Filtramos para no mostrarnos a nosotros mismos en los resultados
        this.resultadosBusqueda = usuarios.filter(u => u.id !== this.usuarioActivo.id);
        this.buscando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscando = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Envía un mensaje a través del WebSocket usando la estructura del Backend
   */
  enviarMensajeChat() {
    if (!this.nuevoMensaje.trim() || !this.chatActivo) return;

    // Preparamos el DTO según lo definido en el Backend
    const mensajeDto: any = {
      contenido: this.nuevoMensaje,
      receptorId: this.chatActivo.id, 
      conversacionId: 0,
      emisorId: this.usuarioActivo.id, // Incluimos emisor para coherencia local
      timestamp: new Date() // Fecha fija para evitar NG0100
    };

    this.chatService.enviarMensaje(mensajeDto);

    // Añadimos el mensaje a la lista local inmediatamente
    this.mensajesChat.push(mensajeDto);

    this.nuevoMensaje = '';
    this.scrollToBottom();
  }

  /**
   * Mueve el scroll de la ventana de chat al último mensaje
   */
  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.myScrollContainer) {
          this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        }
      }, 100);
    } catch (err) { }
  }

  /**
   * LÓGICA DE NOTIFICACIONES DINÁMICAS (Carga inicial)
   */
  procesarNotificacionesSegunRol() {
    this.notificaciones = []; 

    if (this.usuarioActivo?.rol === 'ADMIN') {
      this.authService.getSolicitudesPendientes().subscribe({
        next: (data: any[]) => {
          this.pendientesCount = data.length;
          if (data.length > 0) {
            this.notificaciones.push({
              id: 'noti-admin-verif',
              titulo: 'Verificaciones Pendientes',
              descripcion: `Tienes ${data.length} solicitudes de profesor por revisar.`,
              ruta: '/admin/verificaciones',
              icono: 'verified_user',
              tipo: 'verificacion'
            });
          }
          this.cdr.detectChanges();
        }
      });
    }

    if (this.usuarioActivo?.rol !== 'ADMIN') {
      this.authService.getMiEstadoSolicitud().subscribe({
        next: (solicitud: any) => {
          if (solicitud) {
            if (solicitud.estado === 'RECHAZADA') {
              this.notificaciones.push({
                id: `rechazo-${solicitud.id}`,
                titulo: 'Solicitud Denegada',
                descripcion: `Motivo: ${solicitud.mensajeAdmin || 'No cumple los requisitos.'}`,
                ruta: '/perfil',
                icono: 'error_outline',
                tipo: 'sistema'
              });
            }
            if (solicitud.estado === 'ACEPTADA') {
              this.notificaciones.push({
                id: `exito-${solicitud.id}`,
                titulo: '¡Ya eres Profesor!',
                descripcion: 'Tu cuenta ha sido verificada correctamente.',
                ruta: '/perfil',
                icono: 'check_circle',
                tipo: 'verificacion'
              });
            }
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  /**
   * ACCIONES DE INTERFAZ
   */
  toggleChat() {
    this.mostrarChatFlotante = !this.mostrarChatFlotante;
    if (this.mostrarChatFlotante) {
      this.scrollToBottom();
    }
  }

  clickNotificacion(noti: Notificacion) {
    this.router.navigate([noti.ruta]);
    this.notificaciones = this.notificaciones.filter(n => n.id !== noti.id);
    this.pendientesCount = this.notificaciones.length;
    this.mostrarListaNotis = false;
    this.cdr.detectChanges();
  }

  toggleNotificaciones() {
    this.mostrarListaNotis = !this.mostrarListaNotis;
    this.cdr.detectChanges();
  }

  irAVerificaciones() {
    this.router.navigate(['/admin/verificaciones']);
  }

  irAInicio() {
    this.router.navigate(['/home']);
  }

  setCurso(curso: string) {
    this.cursoSeleccionado = curso;
  }

  verAsignatura(nombre: string) {
    this.router.navigate(['/asignatura', nombre]);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  irAMensajes() {
    this.router.navigate(['/mensajes']);
  }

  aplicarTemaGuardado() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
  }

  cerrarSesion() {
    this.chatService.desconectar();
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}