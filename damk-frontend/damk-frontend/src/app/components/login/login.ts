import { Component } from '@angular/core';
import { Auth } from '../../services/auth'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss', 
  standalone: false
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
      next: (res) => {
        console.log('¡Acceso concedido!', res);
      
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