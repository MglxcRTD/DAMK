import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  sidebarOpen: boolean = true;
  cursoSeleccionado: string = 'PRIMERO';
  
  usuarioActivo: any = {
    username: '',
    puntosReputacion: 0,
    avatarUrl: null
  };

  // Inyectamos el servicio Auth
  constructor(private router: Router, private authService: Auth) {}

  ngOnInit() {
    this.cargarDatosReales();
    this.aplicarTemaGuardado();
  }

  cargarDatosReales() {
    const userJson = localStorage.getItem('usuario');
    
    if (userJson) {
      // Si ya existe en local, lo usamos directamente
      this.usuarioActivo = JSON.parse(userJson);
    } else {
      // Si no hay nada en localStorage, comprobamos si venimos de un login social (OAuth2)
      this.authService.getMe().subscribe({
        next: (user) => {
          // ¡Bingo! Había sesión en el servidor. Guardamos en local y evitamos el rebote al login.
          localStorage.setItem('usuario', JSON.stringify(user));
          this.usuarioActivo = user;
          console.log('Sesión recuperada con éxito:', user.username);
        },
        error: (err) => {
          // Si el servidor también dice que no hay nadie, al login sin miramientos.
          console.error('No hay sesión activa ni datos locales:', err);
          this.router.navigate(['/login']);
        }
      });
    }
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

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  verAsignatura(nombre: string) {
    this.router.navigate(['/asignatura', nombre]);
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