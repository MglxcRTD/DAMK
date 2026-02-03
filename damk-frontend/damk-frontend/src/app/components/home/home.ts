import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core'; 
import { Router } from '@angular/router';
import { Auth } from '../../services/auth'; 
import { Chat } from '../../services/chat'; 
import { MensajeDTO } from '../../models/mensaje.dto'; 

interface Notificacion {
  id: string;
  titulo: string;
  descripcion: string;
  ruta: string;
  icono: string;
  tipo: 'verificacion' | 'sistema' | 'social' | 'amistad'; 
}

interface Contacto {
  id: number;
  username: string;
  avatar?: string; 
  online: boolean;
  ultimoMensaje: string;
  pendientes: number;
  timestamp?: Date; 
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  public sidebarOpen: boolean = true;
  public cursoSeleccionado: string = 'PRIMERO'; 
  public readonly Date = Date;
  
  public notificaciones: Notificacion[] = [];
  public mostrarListaNotis: boolean = false;
  public pendientesCount: number = 0; 

  public mensajesChat: any[] = []; 
  public nuevoMensaje: string = '';       
  public mostrarChatFlotante: boolean = false; 
  public chatActivo: Contacto | null = null;    
  public contactos: Contacto[] = [];           

  public mostrarModalBusqueda: boolean = false; 
  public mostrarSolicitudes: boolean = false;   
  public solicitudesPendientes: any[] = [];     
  public terminoBusqueda: string = '';
  
  public resultadosBusqueda: any[] = [];        
  public buscando: boolean = false;

  public usuariosSistema: Contacto[] = [];      
  public chatTab: 'chats' | 'usuarios' = 'chats'; 

  public usuarioActivo: any = {
    username: 'Cargando...',
    puntosReputacion: 0,
    avatarUrl: null,
    rol: 'ALUMNO' 
  };

  constructor(
    public router: Router, // <--- CAMBIADO A PUBLIC para que el HTML pueda navegar directamente
    private authService: Auth,
    private chatService: Chat, 
    private cdr: ChangeDetectorRef 
  ) {}

  @HostListener('document:click', ['$event'])
  public manejarClicFuera(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      this.mostrarModalBusqueda = false;
      this.cdr.detectChanges();
    }
  }

  ngOnInit() {
    this.cargarDatosReales();
    this.aplicarTemaGuardado();
  }

  ngOnDestroy() {
    this.chatService.desconectar();
  }

  public cargarDatosReales() {
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
        error: () => this.router.navigate(['/login'])
      });
    }
  }

  private inicializarServiciosPostLogin() {
    this.procesarNotificacionesSegunRol();
    
    if (this.usuarioActivo.rol === 'ADMIN') {
      this.cargarDirectorioUsuariosAdmin();
    } else {
      this.obtenerMisAmigosAceptados();
    }

    this.cargarFeedConversaciones();
    
    if (this.usuarioActivo?.id) {
      this.chatService.conectar(this.usuarioActivo.id);
      this.escucharMensajesDeSistema();
    }
  }

  public cargarFeedConversaciones() {
    console.log("[USER] Recuperando feed de conversaciones activas...");
    this.chatService.getConversaciones().subscribe({
      next: (usuarios: any[]) => {
        this.contactos = usuarios.map(u => ({
          id: u.id,
          username: u.username,
          avatar: u.avatarUrl || undefined,
          online: false, 
          ultimoMensaje: 'Ver historial de chat',
          pendientes: 0
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error cargando conversaciones previas", err)
    });
  }

  public cargarDirectorioUsuariosAdmin() {
    this.authService.getTodosLosUsuarios().subscribe({
      next: (users: any[]) => {
        this.usuariosSistema = users.map(u => ({
          id: u.id,
          username: u.username,
          avatar: u.avatarUrl || undefined, 
          online: false, 
          ultimoMensaje: 'Usuario del sistema',
          pendientes: 0
        }));
        this.cdr.detectChanges();
      }
    });
  }

  public escucharMensajesDeSistema() {
    this.chatService.nuevoMensaje$.subscribe((msg: any) => {
      if (msg) {
        console.log("[SOCKET] Procesando mensaje recibido de:", msg.emisorId);
        const mensajeConFecha = { ...msg, timestamp: new Date() };

        let contactoIndex = this.contactos.findIndex(c => c.id === msg.emisorId);
        let contacto: Contacto | undefined;

        if (contactoIndex !== -1) {
          contacto = this.contactos[contactoIndex];
          this.contactos.splice(contactoIndex, 1);
          this.contactos = [contacto, ...this.contactos]; 
        } else {
          contacto = this.usuariosSistema.find(u => u.id === msg.emisorId);

          if (!contacto) {
            contacto = {
              id: msg.emisorId,
              username: msg.nombreEmisor || msg.username || `Usuario ${msg.emisorId}`,
              avatar: undefined, 
              online: true,
              ultimoMensaje: msg.contenido,
              pendientes: 0
            };
          }
          this.contactos = [contacto, ...this.contactos];
        }

        this.chatTab = 'chats'; 
        
        if (contacto) {
          if (this.chatActivo && this.chatActivo.id === msg.emisorId) {
            this.mensajesChat = [...this.mensajesChat, mensajeConFecha];
            this.scrollToBottom();
          } else {
            contacto.pendientes++;
            contacto.ultimoMensaje = msg.contenido;
            
            this.notificaciones = [{
              id: `chat-${Date.now()}`,
              titulo: `Mensaje de ${contacto.username}`,
              descripcion: msg.contenido,
              ruta: `CHAT_OPEN:${contacto.id}`,
              icono: 'forum',
              tipo: 'social'
            }, ...this.notificaciones];
            this.pendientesCount = this.notificaciones.length;
          }
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  public abrirChatCon(id: number) {
    const contacto = this.contactos.find(c => c.id === id) || 
                     this.usuariosSistema.find(u => u.id === id);

    if (contacto) {
      this.chatActivo = contacto;
      this.chatActivo.pendientes = 0; 
      this.mensajesChat = []; 

      this.chatService.getHistorial(id).subscribe({
        next: (historial: any[]) => {
          this.mensajesChat = historial.map(m => ({
            ...m,
            timestamp: m.timestamp || new Date()
          }));
          this.scrollToBottom();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error("Error recuperando historial persistente:", err);
        }
      });
    }
    this.scrollToBottom();
  }

  public enviarMensajeChat() {
    if (!this.nuevoMensaje.trim() || !this.chatActivo) return;

    const mensajeDto: any = {
      contenido: this.nuevoMensaje,
      receptorId: this.chatActivo.id, 
      emisorId: this.usuarioActivo.id, 
      timestamp: new Date() 
    };

    this.chatService.enviarMensaje(mensajeDto);
    this.mensajesChat = [...this.mensajesChat, { ...mensajeDto }];
    this.chatActivo.ultimoMensaje = this.nuevoMensaje;
    this.nuevoMensaje = '';
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    }, 150);
  }

  public toggleSolicitudes() { 
    this.mostrarSolicitudes = !this.mostrarSolicitudes; 
    this.cdr.detectChanges(); 
  }

  public toggleChat() { 
    this.mostrarChatFlotante = !this.mostrarChatFlotante; 
    if (this.mostrarChatFlotante) this.scrollToBottom(); 
  }
  
  public clickNotificacion(noti: Notificacion) {
    if (noti.ruta.startsWith('CHAT_OPEN:')) {
      const idStr = noti.ruta.split(':')[1];
      if (idStr) {
        this.mostrarChatFlotante = true;
        this.abrirChatCon(parseInt(idStr));
      }
    } else {
      this.router.navigate([noti.ruta]);
    }
    this.notificaciones = this.notificaciones.filter(n => n.id !== noti.id);
    this.pendientesCount = this.notificaciones.length;
    this.mostrarListaNotis = false;
    this.cdr.detectChanges();
  }

  public buscarGlobal() {
    if (this.terminoBusqueda.length < 2) {
      this.resultadosBusqueda = [];
      this.mostrarModalBusqueda = false; 
      return;
    }
    
    this.mostrarModalBusqueda = true; 
    this.buscando = true;
    this.authService.busquedaGlobal(this.terminoBusqueda).subscribe({
      next: (res: any) => {
        const apuntes = res.apuntes.map((a: any) => ({ 
          ...a, 
          tipoItem: 'apunte',
          display: a.titulo,
          subtext: a.asignatura 
        }));
        
        const usuarios = res.usuarios.map((u: any) => ({ 
          ...u, 
          tipoItem: 'usuario',
          display: u.username,
          subtext: u.rol 
        }));

        this.resultadosBusqueda = [...apuntes, ...usuarios];
        this.buscando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error en búsqueda global:", err);
        this.buscando = false;
        this.cdr.detectChanges();
      }
    });
  }

  public seleccionarResultado(item: any) {
    if (item.tipoItem === 'apunte') {
      this.router.navigate(['/asignatura', item.asignatura]);
    } else if (item.tipoItem === 'usuario') {
      this.router.navigate(['/perfil'], { queryParams: { id: item.id } });
    }
    this.mostrarModalBusqueda = false; 
    this.terminoBusqueda = ''; 
    this.cdr.detectChanges();
  }

  public buscarUsuariosBD() {
    if (this.terminoBusqueda.length < 3) return;
    this.buscando = true;
    this.authService.buscarUsuarios(this.terminoBusqueda).subscribe({
      next: (usuarios: any[]) => {
        this.resultadosBusqueda = usuarios.filter(u => u.id !== this.usuarioActivo.id);
        this.buscando = false;
        this.cdr.detectChanges();
      }
    });
  }

  public enviarSolicitudAmistad(usuarioDestino: any) {
    this.authService.enviarSolicitudAmistad(this.usuarioActivo.id, usuarioDestino.id).subscribe({
      next: () => {
        this.mostrarModalBusqueda = false;
        this.notificaciones = [{
          id: `social-${Date.now()}`,
          titulo: 'Solicitud Enviada',
          descripcion: `Petición enviada a ${usuarioDestino.username}`,
          ruta: '/home',
          icono: 'person_add',
          tipo: 'social'
        }, ...this.notificaciones];
        this.pendientesCount = this.notificaciones.length;
        this.cdr.detectChanges();
      }
    });
  }

  public aceptarAmistad(solicitud: any) {
    const nuevoAmigo: Contacto = {
      id: solicitud.userId || solicitud.id,
      username: solicitud.username,
      online: true,
      ultimoMensaje: '¡Amistad aceptada!',
      pendientes: 0
    };
    this.contactos = [nuevoAmigo, ...this.contactos];
    this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id !== solicitud.id);
    this.cdr.detectChanges();
  }

  private procesarNotificacionesSegunRol() {
    if (this.usuarioActivo?.rol === 'ADMIN') {
      this.authService.getSolicitudesPendientes().subscribe(data => {
        this.pendientesCount = data.length;
        this.cdr.detectChanges();
      });
    }
  }

  public cerrarConversacion() { this.chatActivo = null; }
  public cambiarTabAdmin(tab: 'chats' | 'usuarios') { this.chatTab = tab; }
  public toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  public setCurso(curso: string) { this.cursoSeleccionado = curso; }
  
  public abrirModalBusqueda() { 
    this.resultadosBusqueda = []; 
    this.cdr.detectChanges();
  }
  
  public cerrarModalBusqueda() { 
    this.mostrarModalBusqueda = false; 
    this.cdr.detectChanges();
  }
  
  public toggleNotificaciones() { this.mostrarListaNotis = !this.mostrarListaNotis; }
  public aplicarTemaGuardado() { }
  public cerrarSesion() { this.chatService.desconectar(); localStorage.removeItem('usuario'); this.router.navigate(['/login']); }
  public irAInicio() { this.router.navigate(['/home']); }
  public irAVerificaciones() { this.router.navigate(['/admin/verificaciones']); }
  public irAPerfil() { this.router.navigate(['/perfil']); }
  public verAsignatura(n: string) { this.router.navigate(['/asignatura', n]); }
  
  // --- NUEVA FUNCIÓN PARA NAVEGAR A MIS APUNTES ---
  public irAMisApuntes() {
    this.router.navigate(['/mis-apuntes']);
  }

  public obtenerMisAmigosAceptados() { 
    console.log("[USER] Sincronizando amigos desde el servidor...");
  }
}