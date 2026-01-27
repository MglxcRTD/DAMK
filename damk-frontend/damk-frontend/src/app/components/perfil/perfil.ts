import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

  // Estados para el Modal Senior
  editando: boolean = false;
  usuarioEdit: any = {}; // Copia de trabajo para el formulario

  constructor(private router: Router) {}

  ngOnInit() {
    this.obtenerUsuarioLogueado();
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.aplicarTema();
  }

  obtenerUsuarioLogueado() {
    const userJson = localStorage.getItem('usuario');
    if (userJson) {
      this.usuario = JSON.parse(userJson);
    } else {
      this.router.navigate(['/login']);
    }
  }

  // --- GESTIÓN DE AJUSTES (MODAL) ---
  
  abrirAjustesCuenta() {
    // Senior tip: Clonamos el objeto para no editar el original por referencia
    this.usuarioEdit = { 
      ...this.usuario,
      password: '' // No mostramos la contraseña actual por seguridad
    };
    this.editando = true;
  }

  guardarCambios() {
    console.log("Sincronizando con Spring Boot...", this.usuarioEdit);
    
    // 1. Aquí llamarías a tu UsuarioService.update(this.usuarioEdit)
    // 2. Simulamos éxito:
    this.usuario = { ...this.usuarioEdit };
    delete this.usuario.password; // No guardamos el pass plano en el state local
    
    localStorage.setItem('usuario', JSON.stringify(this.usuario));
    this.editando = false;
    
    // Podrías añadir una notificación de éxito aquí
  }

  cancelarEdicion() {
    this.editando = false;
    this.usuarioEdit = {};
  }

  // --- UI & THEME ---

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.aplicarTema();
  }

  aplicarTema() {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previsualizacionFoto = reader.result;
        // Senior tip: Aquí enviarías el FormData al servidor inmediatamente
      };
      reader.readAsDataURL(file);
    }
  }

  irAHome() { this.router.navigate(['/home']); }

  cerrarSesion() {
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}