import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth'; 

@Component({
  selector: 'app-perfil',
  standalone: false,
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  
  usuario: any = null; 
  isDarkMode: boolean = false;
  previsualizacionFoto: string | ArrayBuffer | null = null;
  editando: boolean = false;
  usuarioEdit: any = {}; 

  // Feedback visual (Toast)
  mensajeFeedback: { texto: string, tipo: 'exito' | 'error' } | null = null;

  modalProfesorAbierto: boolean = false;
  
  // Mantenemos los nombres de las propiedades alineados con el estándar Java
  solicitudProfesor = { 
    nombre: '', 
    apellidos: '', 
    centroTrabajo: '', 
    linkedIn: '' 
  };

  constructor(
    private router: Router, 
    private cdr: ChangeDetectorRef,
    private authService: Auth 
  ) {}

  ngOnInit() {
    this.cargarDatosUsuario();
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.aplicarTema();
  }

  /**
   * Muestra una notificación temporal en pantalla
   */
  mostrarFeedback(texto: string, tipo: 'exito' | 'error') {
    this.mensajeFeedback = { texto, tipo };
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mensajeFeedback = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  cargarDatosUsuario() {
    const userJson = localStorage.getItem('usuario');
    if (userJson) {
      this.usuario = JSON.parse(userJson);
      
      this.authService.getPerfilActual().subscribe({
        next: (usuarioDB) => {
          this.usuario = usuarioDB;
          localStorage.setItem('usuario', JSON.stringify(usuarioDB));
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error al sincronizar con la DB:", err);
          if (err.status === 401) {
            this.forzarReLogin();
          }
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  // --- GESTIÓN DE LA FOTO DE PERFIL (CLOUDINARY) ---

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && this.usuario) {
      const reader = new FileReader();
      reader.onload = () => { this.previsualizacionFoto = reader.result; };
      reader.readAsDataURL(file);

      this.authService.subirFoto(file).subscribe({
        next: (res) => {
          this.usuario.avatarUrl = res.avatarUrl;
          localStorage.setItem('usuario', JSON.stringify(this.usuario));
          this.mostrarFeedback("Foto de perfil actualizada con éxito", "exito");
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error al subir la foto", err);
          if (err.status === 401) {
            this.forzarReLogin();
          } else {
            this.mostrarFeedback("No se pudo guardar la foto", "error");
            this.previsualizacionFoto = null;
          }
        }
      });
    }
  }

  // --- GESTIÓN DE AJUSTES DE CUENTA ---
  
  abrirAjustesCuenta() {
    this.usuarioEdit = { ...this.usuario, password: '' };
    this.editando = true;
  }

  guardarCambios() {
    // Nota: Aquí se implementaría el método PUT real en el servicio si fuera necesario
    this.usuario = { ...this.usuarioEdit };
    delete this.usuario.password; 
    localStorage.setItem('usuario', JSON.stringify(this.usuario));
    this.editando = false;
    this.mostrarFeedback("Perfil actualizado correctamente", "exito");
  }

  // --- MÉTODOS DE APOYO ---

  private forzarReLogin() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  cancelarEdicion() {
    this.editando = false;
    this.usuarioEdit = {};
  }

  abrirModalProfesor() {
    this.modalProfesorAbierto = true;
    this.cdr.detectChanges();
  }

  /**
   * FLUJO DE VERIFICACIÓN:
   * Enviamos un JSON plano para que el @RequestBody Map del backend no sufra.
   */
  enviarSolicitudVerificacion() {
    // Validación manual antes de enviar
    if (!this.solicitudProfesor.nombre || !this.solicitudProfesor.apellidos || !this.solicitudProfesor.centroTrabajo) {
      this.mostrarFeedback("Por favor, completa los campos obligatorios", "error");
      return;
    }

    // Convertimos a un objeto de datos simple para evitar problemas de tipos
    const datosEnvio = {
      nombre: String(this.solicitudProfesor.nombre),
      apellidos: String(this.solicitudProfesor.apellidos),
      centroTrabajo: String(this.solicitudProfesor.centroTrabajo),
      linkedIn: String(this.solicitudProfesor.linkedIn || "")
    };

    console.log("[SISTEMA] Intentando enviar solicitud docente...", datosEnvio);

    this.authService.solicitarPuestoProfesor(datosEnvio).subscribe({
      next: (res) => {
        console.log("[SERVIDOR] Éxito:", res);
        this.mostrarFeedback("¡Solicitud enviada! La revisaremos pronto", "exito");
        this.modalProfesorAbierto = false;
        
        // Limpiar el formulario
        this.solicitudProfesor = { 
          nombre: '', 
          apellidos: '', 
          centroTrabajo: '', 
          linkedIn: '' 
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("[SERVIDOR] Error capturado:", err);
        
        // Intentamos sacar el mensaje de error del backend
        let mensajeError = "Error al enviar la solicitud";
        if (err.error && typeof err.error === 'object') {
          mensajeError = err.error.message || err.error.error || mensajeError;
        }

        this.mostrarFeedback(mensajeError, "error");
        
        if (err.status === 401) {
          this.forzarReLogin();
        }
      }
    });
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.aplicarTema();
  }

  aplicarTema() {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  irAHome() { this.router.navigate(['/home']); }

  cerrarSesion() {
    this.forzarReLogin();
  }
}