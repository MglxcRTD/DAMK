import { Component, OnInit } from '@angular/core';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-registro',
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
  standalone: false
})
export class Registro implements OnInit {

  usuario = {
    username: '',
    email: '',
    password: ''
  };

  constructor(private authService: Auth, private router: Router) {}

  ngOnInit() {
    this.aplicarTemaPersistente();
  }

  /**
   * Garantiza que si el usuario ya tenía el modo oscuro activado 
   * (por una sesión previa), el registro no se vea blanco.
   */
  private aplicarTemaPersistente() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }

  onSubmit(event: Event) {
    event.preventDefault(); 
    
    // Feedback visual inmediato para el usuario
    const loadingAlert = Swal.fire({
      title: 'Creando cuenta...',
      text: 'Estamos preparando tu nido en DAMK',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.authService.registrar(this.usuario).subscribe({
      next: (res: any) => {
        Swal.fire({
          title: '¡Bienvenido a DAMK!',
          text: `Usuario ${res.user?.username || ''} registrado con éxito`,
          icon: 'success',
          confirmButtonColor: '#FFD200', // Pato Yellow
          confirmButtonText: 'Ir al Login',
          background: document.body.classList.contains('dark-theme') ? '#1e2126' : '#fff',
          color: document.body.classList.contains('dark-theme') ? '#f5f6fa' : '#2d3436',
          timer: 3000,
          timerProgressBar: true
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err: any) => {
        console.error('Error al registrar:', err);
        
        const mensajeError = err.error?.error || 'No hemos podido crear tu cuenta. Inténtalo de nuevo.';

        Swal.fire({
          title: 'Hubo un problema',
          text: mensajeError,
          icon: 'error',
          confirmButtonColor: '#FF8C00', // Pico Orange
          background: document.body.classList.contains('dark-theme') ? '#1e2126' : '#fff',
          color: document.body.classList.contains('dark-theme') ? '#f5f6fa' : '#2d3436'
        });
      }
    });
  }

  loginGoogle() {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  loginGithub() {
    window.location.href = 'http://localhost:8080/oauth2/authorization/github';
  }
}