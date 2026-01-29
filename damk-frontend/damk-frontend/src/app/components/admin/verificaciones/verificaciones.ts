import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-verificaciones',
  standalone: false,
  templateUrl: './verificaciones.html',
  styleUrl: './verificaciones.scss'
})
export class Verificaciones implements OnInit {
  solicitudes: any[] = [];
  cargando: boolean = true;

  // Variables para feedback visual y gestión de rechazo
  mensajeFeedback: { texto: string, tipo: 'exito' | 'error' } | null = null;
  solicitudRechazadaId: number | null = null; 
  motivoRechazo: string = '';

  constructor(
    private authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  /**
   * Muestra notificaciones tipo Toast
   */
  mostrarFeedback(texto: string, tipo: 'exito' | 'error') {
    this.mensajeFeedback = { texto, tipo };
    this.cdr.detectChanges(); 
    
    setTimeout(() => {
      this.mensajeFeedback = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Carga las solicitudes pendientes desde el servidor
   */
  cargarSolicitudes() {
    this.cargando = true;
    this.cdr.detectChanges();

    this.authService.getSolicitudesPendientes().subscribe({
      next: (data) => {
        this.solicitudes = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar solicitudes", err);
        this.cargando = false;
        this.mostrarFeedback('Error al conectar con el servidor', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Gestiona la decisión inicial. 
   * Si es ACEPTADA, se procesa directamente.
   * Si es RECHAZADA, abre el área de texto para el motivo.
   */
  gestionar(id: number, estado: 'ACEPTADA' | 'RECHAZADA') {
    if (estado === 'RECHAZADA') {
      this.solicitudRechazadaId = id;
      this.motivoRechazo = '';
      this.cdr.detectChanges(); 
      return;
    }

    // Proceso de aceptación directa: se envía mensaje genérico de éxito
    this.authService.resolverSolicitud(id, { 
      estado: 'ACEPTADA', 
      mensaje: '¡Felicidades! Tu solicitud de profesor ha sido aprobada.' 
    }).subscribe({
      next: () => {
        this.mostrarFeedback('Usuario verificado como Profesor', 'exito');
        this.cargarSolicitudes();
      },
      error: (err) => this.mostrarFeedback('No se pudo procesar la solicitud', 'error')
    });
  }

  /**
   * Envía el rechazo con el motivo personalizado escrito por el Admin.
   * Este mensaje es el que verá el usuario en su campana.
   */
  confirmarRechazo() {
    if (!this.motivoRechazo || !this.motivoRechazo.trim()) {
      this.mostrarFeedback('Debes escribir un motivo de rechazo', 'error');
      return;
    }

    const payload = { 
      estado: 'RECHAZADA', 
      mensaje: this.motivoRechazo.trim() 
    };

    this.authService.resolverSolicitud(this.solicitudRechazadaId!, payload).subscribe({
      next: () => {
        this.mostrarFeedback('Solicitud rechazada. El usuario recibirá tu mensaje.', 'exito');
        this.solicitudRechazadaId = null;
        this.motivoRechazo = '';
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error("Error al enviar el rechazo", err);
        this.mostrarFeedback('Error al enviar el rechazo', 'error');
      }
    });
  }

  /**
   * Cancela el modo rechazo y vuelve a mostrar los botones de acción
   */
  cancelarRechazo() {
    this.solicitudRechazadaId = null;
    this.motivoRechazo = '';
    this.cdr.detectChanges(); 
  }

  volver() {
    this.router.navigate(['/home']);
  }
}