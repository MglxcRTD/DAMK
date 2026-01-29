import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth'; 

/**
 * Interfaz para gestionar las notificaciones del centro de control
 */
interface Notificacion {
  id: string;
  titulo: string;
  descripcion: string;
  ruta: string;
  icono: string;
  tipo: 'verificacion' | 'sistema' | 'social';
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  // --- VARIABLES DE ESTADO DE LA INTERFAZ ---
  sidebarOpen: boolean = true;
  cursoSeleccionado: string = 'PRIMERO'; 
  
  // Gestión de Notificaciones
  notificaciones: Notificacion[] = [];
  mostrarListaNotis: boolean = false;
  pendientesCount: number = 0; 

  // Objeto de usuario inicializado para evitar errores de renderizado
  usuarioActivo: any = {
    username: 'Cargando...',
    puntosReputacion: 0,
    avatarUrl: null,
    rol: 'ALUMNO' 
  };

  constructor(
    private router: Router, 
    private authService: Auth,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.cargarDatosReales();
    this.aplicarTemaGuardado();
    console.log("[SISTEMA] Home inicializado correctamente.");
  }

  /**
   * Recupera el usuario y activa la lógica de notificaciones
   */
  cargarDatosReales() {
    const userJson = localStorage.getItem('usuario');
    
    if (userJson) {
      this.usuarioActivo = JSON.parse(userJson);
      console.log("[AUTH] Usuario recuperado de LocalStorage:", this.usuarioActivo.username);
      this.procesarNotificacionesSegunRol();
    } else {
      console.log("[AUTH] Verificando sesión con el servidor...");
      this.authService.getMe().subscribe({
        next: (user: any) => { // Tipado explícito para evitar errores
          localStorage.setItem('usuario', JSON.stringify(user));
          this.usuarioActivo = user;
          this.procesarNotificacionesSegunRol();
        },
        error: (err: any) => {
          console.error('[AUTH] No existe sesión activa:', err);
          this.router.navigate(['/login']);
        }
      });
    }
  }

  /**
   * LÓGICA DE NOTIFICACIONES DINÁMICAS:
   * Centraliza qué avisos debe ver cada usuario al entrar.
   */
  procesarNotificacionesSegunRol() {
    this.notificaciones = []; // Limpiamos lista actual

    // 1. Lógica para ADMINISTRADOR (Verificaciones de otros usuarios)
    if (this.usuarioActivo?.rol === 'ADMIN') {
      this.authService.getSolicitudesPendientes().subscribe({
        next: (data: any[]) => { // Tipado explícito para evitar errores
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
          this.cdr.detectChanges(); // Forzamos refresco visual
        },
        error: (err: any) => console.error("[ADMIN] Error al obtener solicitudes:", err)
      });
    }

    // 2. Lógica para ALUMNOS/PROFESORES (Estado de su propia solicitud)
    if (this.usuarioActivo?.rol !== 'ADMIN') {
      // getMiEstadoSolicitud debe estar definido en auth.ts
      this.authService.getMiEstadoSolicitud().subscribe({
        next: (solicitud: any) => {
          if (solicitud) {
            // Caso RECHAZADA: Mostramos el mensaje de rechazo del Admin
            if (solicitud.estado === 'RECHAZADA') {
              this.notificaciones.push({
                id: `rechazo-${solicitud.id}`,
                titulo: 'Solicitud Denegada',
                descripcion: `Motivo: ${solicitud.mensaje || 'No cumple los requisitos.'}`,
                ruta: '/perfil',
                icono: 'error_outline',
                tipo: 'sistema'
              });
            }
            
            // Caso ACEPTADA: Notificamos el éxito
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
        },
        error: (err: any) => console.log("[INFO] No hay historial de solicitudes para este usuario.")
      });
    }
  }

  /**
   * ACCIÓN AL HACER CLICK EN UNA NOTIFICACIÓN
   */
  clickNotificacion(noti: Notificacion) {
    this.router.navigate([noti.ruta]);
    
    // Eliminamos de la lista local
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

  aplicarTemaGuardado() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
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

  cerrarSesion() {
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}