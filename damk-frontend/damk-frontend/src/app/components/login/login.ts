import { Component } from '@angular/core';
import { Auth } from '../../services/auth'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  
  credentials = {
    username: '',
    password: ''
  };

  constructor(private authService: Auth, private router: Router) {}

  onLogin(event: Event) {
    event.preventDefault(); 
    
    console.log('Iniciando sesión en DAMK...', this.credentials);
    
    this.authService.login(this.credentials).subscribe({
      next: (res: any) => {
        console.log('¡Acceso concedido!', res);

        // --- EL CAMBIO ESTÁ AQUÍ ---
        // Guardamos los datos reales que vienen de tu Spring Boot (AuthController)
        // res debe traer username, email, puntosReputacion, etc.
        localStorage.setItem('usuario', JSON.stringify(res.user)); 
        
        // También guardamos el tema preferido (por defecto light si es nuevo)
        if(!localStorage.getItem('theme')) {
          localStorage.setItem('theme', 'light');
        }

        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Fallo en la autenticación:', err);
        alert('Usuario o contraseña incorrectos. Revisa tus credenciales.');
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